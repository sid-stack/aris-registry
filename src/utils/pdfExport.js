let html2pdfLoaderPromise;

async function loadHtml2Pdf() {
  if (!html2pdfLoaderPromise) {
    html2pdfLoaderPromise = import("html2pdf.js").then((module) => module.default || module);
  }
  return html2pdfLoaderPromise;
}

export async function triggerPDFExport() {
  const element = document.getElementById("dashboard-content");
  if (!element) return;

  const previousBackground = element.style.background;
  element.style.background = "#0b1220";

  try {
    const html2pdf = await loadHtml2Pdf();
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: "BidSmith-Intelligence-Report.pdf",
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#0b1220",
          windowWidth: 1400,
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(element)
      .save();
  } catch (error) {
    console.error("PDF export failed:", error);
    window.print();
  } finally {
    element.style.background = previousBackground;
  }
}
