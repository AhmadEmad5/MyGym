import sys
import re

file_path = r'c:\Users\ahmad\OneDrive\Desktop\Projects\MyGym\src\views\SessionDetailView.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove SmartExerciseSwapModal
content = re.sub(r'<SmartExerciseSwapModal[^>]*/>', '', content, flags=re.DOTALL)

# Remove RestTimerFloatingBar
content = re.sub(r'\{/\* Floating Auto-Rest Timer.*?<RestTimerFloatingBar[^>]*/>', '', content, flags=re.DOTALL)

# Remove CelebrationSummaryModal
content = re.sub(r'\{/\* Celebration Summary Modal \*/\}.*?<CelebrationSummaryModal.*?</Modal>', '', content, flags=re.DOTALL)
# It's actually not wrapped in <Modal> but the component itself closes with /> or </CelebrationSummaryModal>
content = re.sub(r'<CelebrationSummaryModal.*?/>', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Script finished')
