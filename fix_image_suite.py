
import os

file_path = r'e:\mln\endoscopy-suite\components\AdvancedImageSuite.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the target block start and a unique part of it
target_start = "// SMART PRIORITY: If both original and edited version of the same image are selected,"

if target_start not in content:
    print("Target not found!")
    # Try to find where it is located relative to onGenerateReport
    # Maybe I missed something.
    exit(1)

# Find the start of the block "if (onGenerateReport) {"
# It should be a few lines above.
start_idx = content.find(target_start)
block_start = content.rfind("if (onGenerateReport) {", 0, start_idx)

if block_start == -1:
    print("Could not find block start")
    exit(1)

# Find the end of this block. It ends with "}"
# We need to find the matching brace.
# But simply, we know what we want to replace.
# We want to replace from "if (onGenerateReport) {" down to the closing "}" for that if.

# Let's count braces to find the end.
current_idx = block_start
brace_count = 0
found_first = False
end_idx = -1

for i, char in enumerate(content[block_start:]):
    if char == '{':
        brace_count += 1
        found_first = True
    elif char == '}':
        brace_count -= 1
    
    if found_first and brace_count == 0:
        end_idx = block_start + i + 1
        break

if end_idx == -1:
    print("Could not find block end")
    exit(1)

original_block = content[block_start:end_idx]
print(f"Replacing block:\n{original_block[:100]}...{original_block[-20:]}")

new_block = """if (onGenerateReport) {
                                        // Pass specific selected IDs (including Originals if checked)
                                        const allSelections = localCaptures.filter(c => !c.deleted && (c.category === 'report' || selectedForReport.has(c.id)));

                                        onGenerateReport(
                                            allSelections.map(c => c.id),
                                            selectedReportTemplates,
                                            allSelections
                                        );
                                    }"""

# Replace
new_content = content[:block_start] + new_block + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced content.")
