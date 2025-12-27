// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('certificateForm');
    const templateImg = document.getElementById('certTemplateImg');

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent actual form submission action

        generatePDF(templateImg);
    });
});

function generatePDF(imgElement) {
    // Access jsPDF from the window object (loaded via CDN)
    const { jsPDF } = window.jspdf;

    // 1. Initialize jsPDF
    // 'l' = landscape, 'pt' = points (easier for precise placement), 'a4' page size
    const doc = new jsPDF('l', 'pt', 'a4');

    // Get A4 dimensions in points (landscape)
    const pageWidth = doc.internal.pageSize.getWidth(); // approx 841.89 pt
    const pageHeight = doc.internal.pageSize.getHeight(); // approx 595.28 pt

    // 2. Add the background image template
    // We draw the image to fill the entire PDF page
    doc.addImage(imgElement, 'PNG', 0, 0, pageWidth, pageHeight);


    // 3. Retrieve user inputs from the form
    const studentName = document.getElementById('studentName').value;
    const instituteName = document.getElementById('instituteName').value;
    const instituteCourse = document.getElementById('instituteCourse').value;
    const websiteCourse = document.getElementById('websiteCourse').value;
    const managerName = document.getElementById('managerName').value;
    
    // Format the date (e.g., December 27, 2050)
    const dateInput = document.getElementById('completionDate').value;
    const dateObj = new Date(dateInput);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Define colors based on template image
    const darkBlue = '#242a45';
    const bodyGray = '#5f6368';


    // --- ADDING TEXT TO PDF ---

    // A. Student Name (Large, Centered)
    doc.setFontSize(42);
    doc.setTextColor(darkBlue);
    // Set font to bold (standard helvetica bold)
    doc.setFont("helvetica", "bold");
    // Using align: 'center' makes the X coordinate the center point
    doc.text(studentName.toUpperCase(), pageWidth / 2, 320, { align: 'center' });


    // B. Body Paragraph
    doc.setFontSize(12);
    doc.setTextColor(bodyGray);
    doc.setFont("helvetica", "normal");

    // Construct the detailed body text string based on inputs
    const bodyText = `This Training Completion Certificate is presented to ${studentName}, currently pursuing ${instituteCourse} at ${instituteName}, for successfully completing the ${websiteCourse} on our educational platform, demonstrating a strong commitment to professional growth and development.`;
    
    // maxWidth ensures the text wraps automatically within a defined width (e.g., 600pt)
    doc.text(bodyText, pageWidth / 2, 380, { align: 'center', maxWidth: 600, lineHeightFactor: 1.5 });


    // C. Manager Name (Bottom Left)
    doc.setFontSize(14);
    doc.setTextColor(darkBlue);
    doc.setFont("helvetica", "bold");
    doc.text(managerName, 180, 495, { align: 'center' });

    // D. Date (Bottom Right)
    doc.text(formattedDate, pageWidth - 180, 495, { align: 'center' });

    // 4. Save the generated PDF
    // Create a filename based on the student's name
    const safeFilename = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Certificate_${safeFilename}.pdf`);
}
