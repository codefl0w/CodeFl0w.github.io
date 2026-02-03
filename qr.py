import qrcode
from pathlib import Path

# ====== Configuration ======

# Folder paths
icons_dir = "/assets/img/icons/"
qr_dir = "/assets/img/qr/"
output_html = "frp_helper_generated.html"  # Generated HTML output file
qr_output_folder = Path("qr_output")  # Local QR image save path
qr_output_folder.mkdir(parents=True, exist_ok=True)

# ====== Tool definition ======
# Each entry = (App Title, Intent URI, Icon Filename, QR Filename)
tools = [
    ("Activity Manager", "intent://com.activitymanager/#Intent;scheme=android-app;end", "activity-manager.png", "activity-manager.png"),
    # Add more tools here
]

# ====== Generate HTML and QR Codes ======
html_blocks = []

for title, intent_uri, icon_file, qr_file in tools:
    # Create QR code
    qr = qrcode.make(intent_uri)
    qr.save(qr_output_folder / qr_file)

    # Generate HTML block
    html = f'''
<div class="tool-button">
  <img src="{icons_dir}{icon_file}" alt="{title} Icon">
  {title}
  <div class="tool-actions">
    <a class="btn-launch" href="{intent_uri}">Launch</a>
    <button class="btn-qr" onclick="showQR('{qr_file}', '{qr_dir}{qr_file}')">QR</button>
  </div>
</div>
'''
    html_blocks.append(html.strip())

# Save all generated HTML to a file
Path(output_html).write_text("\n\n".join(html_blocks), encoding="utf-8")

print(f"✅ Generated {len(tools)} tools.")
print(f"✅ HTML saved to: {output_html}")
print(f"✅ QR codes saved under: {qr_output_folder.resolve()}")
