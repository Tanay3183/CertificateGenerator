document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('certificateForm');
    
    // We need the image loaded in the HTML before we can put it on the PDF
    const templateImg = document.getElementById('certTemplateImg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('generateBtn');
        const originalBtnText = submitBtn.innerText;
        
        // 1. Change button text to show loading state
        submitBtn.innerText = "Consulting AI & Generating...";
        submitBtn.disabled = true;
        submitBtn.style.backgroundColor = "#5f6368"; // Optional: grey out button

        try {
            // 2. Get user inputs from the HTML form
            const details = {
                name: document.getElementById('studentName').value,
                instName: document.getElementById('instituteName').value,
                instCourse: document.getElementById('instituteCourse').value,
                webCourse: document.getElementById('websiteCourse').value,
                manager: document.getElementById('managerName').value,
                date: document.getElementById('completionDate').value
            };

            // 3. Ask your Netlify Backend for the AI text
            const aiText = await fetchAIParagraph(details);

            // 4. Generate the PDF with the AI text
            generatePDF(templateImg, details, aiText);

        } catch (error) {
            console.error("Error:", error);
            alert("Error: Could not generate certificate. Make sure your backend is running.");
        } finally {
            // Reset button to original state
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = "#242a45"; 
        }
    });
});

// --- Debugging Version of fetchAIParagraph ---
async function fetchAIParagraph(data) {
    const url = '/.netlify/functions/generate-text';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // If the server failed (e.g., 500 error), get the text reason why
        if (!response.ok) {
            const errorText = await response.text(); 
            alert("Server Error Details:\n" + errorText); // <--- This will pop up on your screen
            throw new Error(errorText);
        }

        const result = await response.json();
        
        // Check if the text actually exists
        if (!result.text) {
            alert("Google AI replied, but with no text. Check API Key quotas.");
            return "Certificate of completion.";
        }

        return result.text;

    } catch (e) {
        console.error("Full Error:", e);
        // Don't just return fallback, alert the user so we know!
        alert("Connection Failed: " + e.message);
        return "Certificate of completion.";
    }
}

// --- Function to Generate PDF ---
function generatePDF(imgElement, data, bodyText) {
    // Access jsPDF from the window object
    const { jsPDF } = window.jspdf;
    
    // Create PDF: landscape, points unit, A4 size
    const doc = new jsPDF('l', 'pt', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Draw the background template image
    // Note: ensure template.png is in the same folder and loaded in the HTML <img> tag
    doc.addImage(imgElement, 'PNG', 0, 0, pageWidth, pageHeight);

    // Define styling colors
    const darkBlue = '#242a45';
    const bodyGray = '#5f6368';

    // --- 1. Student Name (Large, Centered) ---
    doc.setFontSize(42);
    doc.setTextColor(darkBlue);
    doc.setFont("helvetica", "bold");
    doc.text(data.name.toUpperCase(), pageWidth / 2, 320, { align: 'center' });

    // --- 2. AI Generated Body Paragraph ---
    doc.setFontSize(12);
    doc.setTextColor(bodyGray);
    doc.setFont("helvetica", "normal");
    
    // Clean text: remove accidental newlines from AI
    const cleanText = bodyText.replace(/\n/g, " ").trim();

    // Wrap text so it doesn't go off the page (width limited to 600pts)
    const splitText = doc.splitTextToSize(cleanText, 600);
    
    doc.text(splitText, pageWidth / 2, 380, { align: 'center', lineHeightFactor: 1.5 });

    // --- 3. Manager Name & Date ---
    // Format date nicely (e.g., December 27, 2025)
    const dateObj = new Date(data.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });

    doc.setFontSize(14);
    doc.setTextColor(darkBlue);
    doc.setFont("helvetica", "bold");
    
    // Manager Name (Left side)
    doc.text(data.manager, 180, 495, { align: 'center' });
    
    // Date (Right side)
    doc.text(formattedDate, pageWidth - 180, 495, { align: 'center' });

    // --- 4. Save/Download ---
    const safeFilename = data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Certificate_${safeFilename}.pdf`);
}