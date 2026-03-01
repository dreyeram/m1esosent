# Endoscopy Suite — Raspberry Pi 5 Deployment Guide

**Goal**: Power On → **Black Screen** → **App in Full-Screen Kiosk** (no desktop, no splash, no logos)

---

## PHASE 1: PREPARE THE PI (First-Time Only)

> Skip to **PHASE 2** if the Pi is already set up with OS, SSH, Node.js etc.

### 1.1 Flash Raspberry Pi OS

1. Open **Raspberry Pi Imager** on your PC.
2. **OS**: `Raspberry Pi OS (64-bit)` — **Desktop Version**.
3. **Settings** (⚙ Gear):
   - Hostname: `lm`
   - Username: `lm` / Password: `lmadmin`
   - WiFi: Configure your network
   - SSH: **Enable**
4. **Write** and wait.

### 1.2 Silent Boot Config (On PC, Before First Boot)

After flashing, **keep the SD card mounted**. Open the `bootfs` partition.

#### Edit `config.txt`

Replace the `[all]` section at the end with:

```ini
[all]

# ===== SILENT BOOT =====
disable_splash=1
boot_delay=0
gpu_mem=256
max_usb_current=1
hdmi_blanking=0
dtoverlay=dwc2

# Force HDMI Hotplug and Resolution (Strictly 1920x1080)
hdmi_force_hotplug=1
hdmi_group=1
hdmi_mode=16
```

#### Edit `cmdline.txt`

This **MUST be a SINGLE line**. Replace the entire content with:

```
console=tty3 loglevel=0 quiet logo.nologo vt.global_cursor_default=0 plymouth.enable=0 root=PARTUUID=XXXXXXXX-XX rootfstype=ext4 fsck.repair=yes rootwait
```

> **⚠ IMPORTANT**: Keep the **original `PARTUUID`** value from your file. Do NOT change it.

Eject the SD card and insert into the Pi. Power on.

### 1.3 First Boot System Setup (via SSH)

```bash
ssh lm@lm.local
# Password: lmadmin
```

#### Disable Plymouth (boot splash service)

```bash
sudo systemctl mask plymouth-start.service
sudo systemctl mask plymouth-quit-wait.service
sudo systemctl mask plymouth-quit.service
```

#### Set to Console Autologin (NOT Desktop Autologin)

```bash
sudo raspi-config
```
Navigate: **1 System Options** → **S5 Boot / Auto Login** → **B2 Console Autologin**

> We do NOT use Desktop Autologin. We use **Console Autologin + manual xinit** so there is zero desktop environment loading.

#### Update System & Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y xserver-xorg xinit openbox firefox-esr unclutter xdotool x11-xserver-utils curl git python3-opencv python3-numpy
```

#### Camera Access (V4L2)

```bash
# Add user to video group for camera access
sudo usermod -aG video lm
```

#### Install Node.js 20 & PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

#### Verify

```bash
node -v   # Should show v20.x
npm -v
pm2 -v
```

---

## PHASE 2: INSTALL / UPDATE THE APPLICATION

> **This is the section you run every time you deploy a new version.**

### 2.1 SSH into the Pi

```bash
ssh lm@lm.local
```

### 2.2 Clone or Update the Repo

#### First Time (Clone)

```bash
cd ~
git clone https://github.com/dreyeram/endoscopy-app.git endoscopy-suite
cd endoscopy-suite
```

#### Subsequent Updates (Pull Latest)

```bash
cd ~/endoscopy-suite

# Stop the running app first
pm2 stop endoscopy-suite

# Fetch latest and switch to the deployment branch
git fetch origin
git checkout -b deploy/v$(date +%Y%m%d) origin/feat/build-fixes
# This creates a new branch named e.g. deploy/v20260219 from the latest remote code
```

> **Why a new branch?** This keeps a clean rollback point. If anything goes wrong, you can:
> ```bash
> git checkout deploy/v<previous-date>
> npm run build
> pm2 restart endoscopy-suite
> ```

### 2.3 Install Dependencies

```bash
npm install --production=false
```

> `--production=false` ensures devDependencies (Prisma CLI, TypeScript, etc.) are installed — they're needed for the build step.

### 2.4 Setup Environment

```bash
cat > .env << 'EOF'
# Database
DATABASE_URL="file:/home/lm/endoscopy-suite/prisma/dev.db"

# JWT Secrets
JWT_SECRET="endoscopy-suite-jwt-secret-change-in-production-to-random-string"
JWT_REFRESH_SECRET="endoscopy-suite-refresh-secret-change-in-production-to-random-string"

# Storage
INTERNAL_STORAGE_PATH="./data"

# Node environment
NODE_ENV="production"
EOF
```

### 2.5 Database Push (The Proper Way)

```bash
# Step 1: Generate the Prisma client (compiles schema → node_modules)
npx prisma generate

# Step 2: Push schema to database
# This is SAFE — it creates/alters tables to match schema WITHOUT dropping data
npx prisma db push
```

> **Why `db push` and not `migrate`?**
> - `db push` is designed for **prototyping and single-instance SQLite** — exactly our case.
> - It compares your `schema.prisma` against the current database and applies the diff.
> - It will **NOT** drop tables unless a change is incompatible (and it warns you first).
> - For a single-Pi deployment with SQLite, this is the correct and recommended approach.

#### First-time only: Seed the admin user

```bash
node scripts/seed-admin.js
```

> Default login: `demo@clinic.com` / `demo123`

### 2.6 Build the Application

```bash
npm run build
```

> This compiles the Next.js app into the `.next` folder for production. Takes ~3-5 minutes on Pi 5.

### 2.7 Create Logs Directory

```bash
mkdir -p ~/endoscopy-suite/logs
```

### 2.8 Start with PM2 (The Proper Way)

```bash
# Start using the ecosystem config file
pm2 start ecosystem.config.js

# Verify it's running
pm2 status
pm2 logs endoscopy-suite --lines 20

# Wait for it to be ready (should show "Ready on http://0.0.0.0:3000")
# Then test:
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Should return 200
```

#### Save & Enable Auto-Start on Boot

```bash
pm2 save
pm2 startup
```
> **⚠ PM2 will print a `sudo env PATH=...` command. COPY AND RUN THAT COMMAND.**

#### PM2 Quick Reference

| Command | Description |
|---|---|
| `pm2 status` | Check app status |
| `pm2 logs endoscopy-suite` | View live logs |
| `pm2 restart endoscopy-suite` | Restart the app |
| `pm2 stop endoscopy-suite` | Stop the app |
| `pm2 delete endoscopy-suite` | Remove from PM2 |
| `pm2 monit` | Real-time monitoring |

---

## PHASE 3: KIOSK MODE SETUP

> This makes the Pi boot directly into the app — no desktop, no splash screens.

### 3.1 Create the Kiosk Startup Script

```bash
cat > ~/.xinitrc << 'XINITRC'
#!/bin/bash

# --- FORCE RESOLUTION START ---
# Force HDMI-1 to 1920x1080 and disable any ghost screens
xrandr --output HDMI-1 --primary --mode 1920x1080
xrandr --output HDMI-2 --off
# --- FORCE RESOLUTION END ---

xsetroot -solid black
xset s off -dpms s noblank
unclutter -idle 5 -root &

openbox-session &

# Wait for the app to be ready
until curl -s http://localhost:3000 > /dev/null 2>&1; do
  sleep 0.5
done

# Use Firefox in kiosk mode
exec firefox-esr \
  --kiosk \
  http://localhost:3000
XINITRC

chmod +x ~/.xinitrc
```

### 3.2 Auto-Start X Server on Console Login

```bash
cat >> ~/.bash_profile << 'BASHPROFILE'

# Auto-start X (kiosk) if on tty1 and X is not already running
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  exec startx -- -nocursor 2>/dev/null
fi
BASHPROFILE
```

> **How this works:**
> 1. Pi boots → Console autologin on tty1
> 2. `.bash_profile` detects tty1 → runs `startx`
> 3. `startx` reads `~/.xinitrc` → forces 1920x1080 → starts openbox → waits for app → launches Firefox kiosk
> 4. **No desktop environment** is ever loaded. Just X → openbox → Firefox.

### 3.3 Force Screen Resolution in Config (Already Done in Phase 1)

The `/boot/firmware/config.txt` should already have these at the end:

```ini
[all]
disable_splash=1
boot_delay=0
gpu_mem=256
max_usb_current=1
hdmi_blanking=0
dtoverlay=dwc2
hdmi_force_hotplug=1
hdmi_group=1
hdmi_mode=16
```

If it doesn't, edit it:

```bash
sudo nano /boot/firmware/config.txt
```

Also make sure `camera_auto_detect=0` is set (to avoid the camera detection splash).

---

## PHASE 4: REBOOT & VERIFY

```bash
sudo reboot
```

### Expected Boot Sequence

| Time | What Happens |
|---|---|
| 0-5s | **Black screen** (no rainbow, no Pi logo, no text) |
| 5-15s | **Still black** (console autologin happens invisibly, X starts) |
| 15-25s | **Still black** (app is starting via PM2, Firefox waits) |
| 25-35s | **App appears** full-screen in Firefox kiosk mode |

### No Other Screens Will Appear

- ❌ No Raspberry Pi rainbow splash
- ❌ No boot text / kernel log
- ❌ No Plymouth splash animation
- ❌ No desktop / taskbar / wallpaper
- ❌ No login screen
- ✅ Only **black → app**

---

## QUICK UPDATE CHEAT SHEET

When you need to deploy a new version, here's the minimal set of commands:

```bash
# 1. SSH in
ssh lm@lm.local

# 2. Go to app directory
cd ~/endoscopy-suite

# 3. Pull latest code (from your new branch)
git fetch origin
git checkout final60fps
git pull origin final60fps

# 4. Run the Clean Rebuild Script (Recommended)
# This automates: Install -> Prisma -> Build -> Restart
chmod +x scripts/rebuild-pi.sh
./scripts/rebuild-pi.sh

# 5. Verify
pm2 logs endoscopy-suite --lines 10
```

---

## TROUBLESHOOTING

### App not starting?

```bash
pm2 logs endoscopy-suite --err --lines 50
# Check if port 3000 is in use:
sudo lsof -i :3000
```

### Screen not 1920x1080?

```bash
# Check connected displays
xrandr
# Force resolution
xrandr --output HDMI-1 --mode 1920x1080
```

### Database errors after update?

```bash
cd ~/endoscopy-suite
npx prisma db push --accept-data-loss
# ⚠ Only use --accept-data-loss if you're okay with potential data loss for incompatible changes
```

### Still seeing desktop/splash?

```bash
# Verify console autologin (not desktop)
sudo raspi-config
# → 1 System Options → S5 → B2 Console Autologin

# Verify Plymouth is masked
sudo systemctl status plymouth-start.service
# Should say "masked"

# Verify cmdline.txt
cat /boot/firmware/cmdline.txt
# Should contain: quiet logo.nologo plymouth.enable=0
```

### PM2 not starting on boot?

```bash
pm2 unstartup
pm2 startup
# Run the sudo command it outputs!
pm2 save
```

### Need to reset PM2 completely?

```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```
