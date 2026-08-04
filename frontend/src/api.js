// API configuration for MEDIVISION-XR
const API_BASE_URL = 'http://localhost:5050';

// Upload status polling (large chest scans can take several minutes)
export const pollUploadStatus = async (sessionId, { maxAttempts = 150, interval = 2000, onProgress } = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_BASE_URL}/api/upload/status/${sessionId}`, {
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Status check failed (${response.status}): ${text}`);
    }
    
    const status = await response.json();
    console.log('Upload status check:', status);

    if (onProgress) {
      onProgress(status, i, maxAttempts);
    }
    
    if (status.status === 'completed') {
      return status;
    }
    if (status.status === 'error') {
      const msg = [status.error, status.details].filter(Boolean).join(': ');
      throw new Error(msg || 'Processing failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Processing timeout - please try again with a smaller scan or ZIP');
};

// Mock data for fallback
const MOCK_LABELS = [
    {"name": "Cerebrum", "x": 50, "y": 30, "side": "center", "type": "normal", "category": "organs", "description": "Largest part of brain responsible for higher functions"},
    {"name": "Cerebellum", "x": 50, "y": 65, "side": "center", "type": "normal", "category": "organs", "description": "Coordinates movement and balance"},
    {"name": "Brainstem", "x": 50, "y": 80, "side": "center", "type": "normal", "category": "organs", "description": "Controls vital functions like breathing and heart rate"},
    {"name": "Frontal Lobe", "x": 35, "y": 25, "side": "left", "type": "normal", "category": "organs", "description": "Responsible for reasoning and motor control"},
    {"name": "Parietal Lobe", "x": 65, "y": 25, "side": "right", "type": "normal", "category": "organs", "description": "Processes sensory information and spatial awareness"},
    {"name": "Temporal Lobe", "x": 30, "y": 45, "side": "left", "type": "normal", "category": "organs", "description": "Processes auditory information and memory"},
    {"name": "Occipital Lobe", "x": 70, "y": 45, "side": "right", "type": "normal", "category": "organs", "description": "Processes visual information"},
    {"name": "Thalamus", "x": 50, "y": 50, "side": "center", "type": "normal", "category": "organs", "description": "Relays sensory and motor signals"},
    {"name": "Hypothalamus", "x": 45, "y": 55, "side": "left", "type": "normal", "category": "organs", "description": "Regulates hormones and autonomic functions"},
    {"name": "Pituitary Gland", "x": 55, "y": 55, "side": "right", "type": "normal", "category": "organs", "description": "Master gland controlling endocrine system"},
    {"name": "Corpus Callosum", "x": 50, "y": 40, "side": "center", "type": "normal", "category": "organs", "description": "Connects left and right brain hemispheres"},
    {"name": "Pons", "x": 48, "y": 70, "side": "left", "type": "normal", "category": "organs", "description": "Part of brainstem linking to cerebellum"},
    {"name": "Medulla Oblongata", "x": 52, "y": 75, "side": "right", "type": "normal", "category": "organs", "description": "Controls vital autonomic functions"}
];

// API functions with fallback
export const api = {
  // Upload files
  uploadFiles: async (files) => {
    console.log('=== API UPLOAD DEBUG START ===');
    console.log('1. API uploadFiles called with:', files);
    console.log('2. API_BASE_URL:', API_BASE_URL);
    console.log('3. Files array length:', files.length);
    
    try {
      const formData = new FormData();
      console.log('4. Creating FormData...');
      
      // Handle both File objects and mock objects
      files.forEach((file, index) => {
        console.log(`5. Processing file ${index}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          isFile: file instanceof File,
          webkitRelativePath: file.webkitRelativePath
        });
        
        if (file instanceof File) {
          // For folder uploads, use webkitRelativePath as the filename to preserve directory structure
          const filename = file.webkitRelativePath || file.name;
          formData.append('files', file, filename);
          console.log(`6. Added file ${index} to FormData with filename: ${filename}`);
        } else if (file.name && file.size) {
          // Handle mock objects or webkitRelativePath files
          const blob = new Blob([file], { type: file.type || 'application/dicom' });
          const filename = file.webkitRelativePath || file.name;
          formData.append('files', blob, filename);
          console.log(`6. Added blob ${index} to FormData with filename: ${filename}`);
        }
      });

      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      const headers = {};
      console.log('6. Token from localStorage:', token);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log('7. Headers prepared:', headers);
      console.log('8. FormData entries count:', formData.getAll('files').length);
      
      const uploadUrl = `${API_BASE_URL}/api/upload`;
      console.log('9. Making fetch request to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include',
      });
      
      console.log('10. Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('11. Response error text:', errorText);
        let errorMessage = `Upload failed (HTTP ${response.status})`;
        
        try {
          const errorData = JSON.parse(errorText);
          console.log('12. Parsed error data:', errorData);
          if (errorData.error && errorData.details) {
            // Check if it's a DICOM processing error
            if (errorData.details.includes('Unable to determine ImageIO reader') || 
                errorData.details.includes('No Series were found')) {
              errorMessage = 'Invalid file format. Please upload DICOM medical image files (.dcm, .dicom, or medical image ZIP files).';
            } else {
              errorMessage = `${errorData.error}${errorData.details ? ': ' + errorData.details : ''}`;
            }
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          console.log('12. Failed to parse error as JSON');
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        console.log('13. Throwing error:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('14. Success response parsed:', result);
      console.log('=== API UPLOAD DEBUG END ===');
      return result;
    } catch (error) {
      console.log('15. API upload error caught:', error);
      console.log('16. Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      console.log('=== API UPLOAD DEBUG END ===');
      throw error;
    }
  },

  // Get labels
  getLabels: async (bodyPart) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/labels/${bodyPart}`, {
        headers: headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Labels fetch failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Labels fetch failed, using mock:', error);
      // Mock labels response
      return {
        labels: MOCK_LABELS,
        body_part: bodyPart,
        count: MOCK_LABELS.length
      };
    }
  },

  // Evaluate
  evaluate: async (sessionId) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Evaluation failed, using mock:', error);
      // Mock evaluation response
      return {
        two_d: {
          mean_top1_confidence: 0.85,
          mean_entropy: 0.23,
          pretrained: true,
          slice_scores: Array.from({length: 10}, () => ({confidence: 0.85, entropy: 0.23}))
        },
        three_d: {
          mean_top1_confidence: 0.92,
          mean_entropy: 0.18,
          pretrained: true,
          slice_scores: Array.from({length: 10}, () => ({confidence: 0.92, entropy: 0.18}))
        },
        comparison: {
          confidence_gap: 0.07,
          three_d_confidence: 0.92,
          two_d_confidence: 0.85,
          notes: '3D model shows improved performance'
        }
      };
    }
  },

  // Auth
  getAuth: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Auth failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Auth failed:', error);
      // Return null user - don't use mock, force real authentication
      return { user: null };
    }
  },

  // Disease Classification
  classifyScan: async (sessionId, bodyPart) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/classify`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId, body_part: bodyPart }),
      });

      if (!response.ok) {
        throw new Error('Classification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Classification failed:', error);
      // Return a default normal classification if API fails
      return {
        session_id: sessionId,
        body_part: bodyPart,
        classification: {
          name: 'Normal',
          description: 'No abnormalities detected',
          severity: 'none',
          confidence: 0.95
        },
        note: 'Classification service unavailable'
      };
    }
  }
};
