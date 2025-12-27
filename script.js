document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('certificateForm');
    
    // We need the image loaded before we can use it
    const templateImg = document.getElementById('certTemplateImg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('generateBtn');
        const originalBtnText = submitBtn.innerText;
        
        // 1. Change button text to show loading state
        submitBtn.innerText = "Consulting AI & Generating...";
        submitBtn.disabled = true;

        try {
            // 2. Get user inputs
            const details = {
                name: document.getElementById('studentName').value,
                instName: document.getElementById('instituteName').value,
                instCourse: document.getElementById('instituteCourse').value,
                webCourse: document.getElementById('websiteCourse').value,
                manager: document.getElementById('managerName').value,
                date: document.getElementById('completionDate').value
            };

            // 3. Ask AI for the paragraph
            const aiText = await fetchAIParagraph(details);

            // 4. Generate the PDF with the AI text
            generatePDF(templateImg, details, aiText);

        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong with the AI generation. Please try again.");
        } finally {
            // Reset button
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});

// --- Function to Call Google Gemini API ---
async function fetchAIParagraph(data) {
    const apiKey = "AIzaSyCIEyA-59xci_EQOfOoBx7L7lFTRnpnWDg"; // <--- PASTE YOUR KEY HERE
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Prompt engineering: We tell the AI exactly what we want
    const prompt = `
        Write a formal, professional, and unique single-paragraph certificate recognition statement (approx 30-40 words) for a student named "${data.name}".
        They are currently studying "${data.instCourse}" at "${data.instName}".
        They have successfully completed the course "${data.webCourse}" on our platform.
        Do not start with "This certifies that". Make it sound appreciative of their specific background. 
        Only return the paragraph text, nothing else.
    `;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    });

    const result = await response.json();
    
    // Extract the text from Gemini's response structure
    try {
        return result.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error("AI Parse Error", result);
        return "This certificate is awarded for the successful completion of the training, demonstrating high proficiency and dedication."; // Fallback text
    }
}

// --- Function to Generate PDF ---
function generatePDF(imgElement, data, bodyText) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Draw background
    doc.addImage(imgElement, 'PNG', 0, 0, pageWidth, pageHeight);

    const darkBlue = '#242a45';
    const bodyGray = '#5f6368';

    // 1. Student Name
    doc.setFontSize(42);
    doc.setTextColor(darkBlue);
    doc.setFont("helvetica", "bold");
    doc.text(data.name.toUpperCase(), pageWidth / 2, 320, { align: 'center' });

    // 2. AI Generated Body Paragraph
    doc.setFontSize(12);
    doc.setTextColor(bodyGray);
    doc.setFont("helvetica", "normal");
    
    // We clean the text (remove newlines if AI added them)
    const cleanText = bodyText.replace(/\n/g, " ").trim();

    // doc.splitTextToSize breaks the long AI string into multiple lines so it fits
    // 600 is the width in points allowed for the text block
    const splitText = doc.splitTextToSize(cleanText, 600);
    
    doc.text(splitText, pageWidth / 2, 380, { align: 'center', lineHeightFactor: 1.5 });

    // 3. Manager & Date
    const dateObj = new Date(data.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });

    doc.setFontSize(14);
    doc.setTextColor(darkBlue);
    doc.setFont("helvetica", "bold");
    doc.text(data.manager, 180, 495, { align: 'center' });
    doc.text(formattedDate, pageWidth - 180, 495, { align: 'center' });

    // Save
    const safeFilename = data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Certificate_${safeFilename}.pdf`);
}
