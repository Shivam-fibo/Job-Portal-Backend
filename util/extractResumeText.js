import fetch from 'node-fetch';
import PDFParser from 'pdf2json';

export const extractTextFromPdfUrl = async (url) => {
  try {
    // Fetch the PDF with better error handling
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('pdf')) {
      console.warn(`Warning: Content-Type is ${contentType}, expected PDF`);
    }
    
    const arrayBuffer = await res.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('PDF file is empty');
    }
    
    console.log(`PDF size: ${arrayBuffer.byteLength} bytes`);
    
    const parser = new PDFParser(null, 1); // Enable better error handling

    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('PDF parsing timeout (30 seconds)'));
      }, 30000);

      parser.on("pdfParser_dataError", err => {
        clearTimeout(timeout);
        console.error('PDF Parser Error:', err);
        reject(new Error(`PDF parsing failed: ${err.parserError || err.message}`));
      });

      parser.on("pdfParser_dataReady", pdfData => {
        clearTimeout(timeout);
        
        try {
          console.log('PDF Data structure:', JSON.stringify(pdfData, null, 2).substring(0, 500) + '...');
          
          // More robust data extraction
          let pages = null;
          
          // Try different possible data structures
          if (pdfData?.Pages) {
            pages = pdfData.Pages;
          } else if (pdfData?.formImage?.Pages) {
            pages = pdfData.formImage.Pages;
          } else if (pdfData?.data?.Pages) {
            pages = pdfData.data.Pages;
          }
          
          if (!pages || !Array.isArray(pages)) {
            console.error('Available PDF data keys:', Object.keys(pdfData));
            return reject(new Error("PDF data does not contain readable Pages. Structure might be unsupported."));
          }
          
          if (pages.length === 0) {
            return reject(new Error("PDF contains no pages"));
          }
          
          console.log(`Found ${pages.length} pages`);
          
          const rawText = pages.map((page, pageIndex) => {
            try {
              if (!page.Texts || !Array.isArray(page.Texts)) {
                console.warn(`Page ${pageIndex + 1} has no readable text`);
                return '';
              }
              
              return page.Texts.map(text => {
                try {
                  if (!text.R || !Array.isArray(text.R)) {
                    return '';
                  }
                  
                  return text.R.map(r => {
                    try {
                      return decodeURIComponent(r.T || '');
                    } catch (decodeError) {
                      console.warn('Failed to decode text:', r.T);
                      return r.T || '';
                    }
                  }).join('');
                } catch (textError) {
                  console.warn('Error processing text element:', textError);
                  return '';
                }
              }).join(' ');
            } catch (pageError) {
              console.warn(`Error processing page ${pageIndex + 1}:`, pageError);
              return '';
            }
          }).join(' ');

          if (!rawText.trim()) {
            return reject(new Error("PDF contains no extractable text"));
          }

          // Clean and process the text, removing single-letter words
          const words = rawText
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 1);

          console.log(`Extracted ${words.length} words from PDF`);
          resolve(words);
          
        } catch (processingError) {
          console.error('Error processing PDF data:', processingError);
          reject(new Error(`Failed to process PDF content: ${processingError.message}`));
        }
      });

      try {
        parser.parseBuffer(Buffer.from(arrayBuffer));
      } catch (parseError) {
        clearTimeout(timeout);
        console.error('Error starting PDF parse:', parseError);
        reject(new Error(`Failed to start PDF parsing: ${parseError.message}`));
      }
    });
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
};

// Alternative function using a different approach for problematic PDFs
export const extractTextFromPdfUrlAlternative = async (url) => {
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const arrayBuffer = await res.arrayBuffer();
    const parser = new PDFParser(null, 1);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PDF parsing timeout'));
      }, 30000);

      parser.on("pdfParser_dataError", err => {
        clearTimeout(timeout);
        // Instead of rejecting, try to return empty result
        console.warn('PDF parsing failed, returning empty result:', err);
        resolve([]);
      });

      parser.on("pdfParser_dataReady", pdfData => {
        clearTimeout(timeout);
        
        try {
          // Try to extract any available text content
          let extractedText = '';
          
          // Method 1: Try the standard approach
          if (pdfData?.formImage?.Pages) {
            extractedText = extractFromStandardStructure(pdfData.formImage.Pages);
          }
          
          // Method 2: Try alternative structures
          if (!extractedText && pdfData?.Pages) {
            extractedText = extractFromStandardStructure(pdfData.Pages);
          }
          
          // Method 3: Try to extract from any text-like properties
          if (!extractedText) {
            extractedText = extractFromAnyTextProperties(pdfData);
          }
          
          if (!extractedText.trim()) {
            console.warn('No text could be extracted from PDF');
            resolve([]);
            return;
          }
          
          const words = extractedText
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 1);

          resolve(words);
          
        } catch (error) {
          console.warn('Error in alternative extraction:', error);
          resolve([]);
        }
      });

      parser.parseBuffer(Buffer.from(arrayBuffer));
    });
    
  } catch (error) {
    console.error('Alternative PDF extraction error:', error);
    return [];
  }
};

function extractFromStandardStructure(pages) {
  if (!Array.isArray(pages)) return '';
  
  return pages.map(page => {
    if (!page.Texts || !Array.isArray(page.Texts)) return '';
    
    return page.Texts.map(text => {
      if (!text.R || !Array.isArray(text.R)) return '';
      
      return text.R.map(r => {
        try {
          return decodeURIComponent(r.T || '');
        } catch {
          return r.T || '';
        }
      }).join('');
    }).join(' ');
  }).join(' ');
}

function extractFromAnyTextProperties(obj, depth = 0) {
  if (depth > 10) return ''; // Prevent infinite recursion
  
  let text = '';
  
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (typeof obj !== 'object' || obj === null) {
    return '';
  }
  
  for (const [key, value] of Object.entries(obj)) {
    if (key.toLowerCase().includes('text') || key === 'T') {
      if (typeof value === 'string') {
        try {
          text += ' ' + decodeURIComponent(value);
        } catch {
          text += ' ' + value;
        }
      }
    } else if (typeof value === 'object') {
      text += ' ' + extractFromAnyTextProperties(value, depth + 1);
    }
  }
  
  return text;
}
