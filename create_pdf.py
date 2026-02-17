from reportlab.pdfgen import canvas

c = canvas.Canvas("test_rfp.pdf")
c.drawString(100, 750, "RFP: Autonomous Logistics Systems")
c.drawString(100, 730, "Agency: Department of Defense (DARPA)")
c.drawString(100, 710, "Est. Value: $5M - $10M")
c.drawString(100, 690, "Deadline: 2026-12-01")
c.drawString(100, 670, "Summary: We need decentralized agent swarms for logistics.")
c.save()
print("test_rfp.pdf created")
