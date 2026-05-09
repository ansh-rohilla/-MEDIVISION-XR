from flask import Blueprint, jsonify, request
import random

classification_bp = Blueprint('classification', __name__)

# Simulated disease classification data based on body part
# In production, this would use a trained ML model
DISEASE_CLASSIFICATIONS = {
    'brain': {
        'normal': {
            'name': 'Normal',
            'description': 'No abnormalities detected',
            'severity': 'none',
            'confidence': 0.95
        },
        'glioma': {
            'name': 'Glioma',
            'description': 'Primary brain tumor originating from glial cells',
            'severity': 'high',
            'confidence': 0.87,
            'subtype': random.choice(['Glioblastoma Multiforme', 'Astrocytoma', 'Oligodendroglioma'])
        },
        'meningioma': {
            'name': 'Meningioma',
            'description': 'Tumor arising from meninges, usually benign',
            'severity': 'medium',
            'confidence': 0.92,
            'subtype': random.choice(['Benign Meningioma', 'Atypical Meningioma'])
        },
        'pituitary': {
            'name': 'Pituitary Adenoma',
            'description': 'Tumor of the pituitary gland',
            'severity': 'low',
            'confidence': 0.89,
            'subtype': random.choice(['Microadenoma', 'Macroadenoma'])
        }
    },
    'chest': {
        'normal': {
            'name': 'Normal',
            'description': 'No abnormalities detected',
            'severity': 'none',
            'confidence': 0.94
        },
        'lung_cancer': {
            'name': 'Lung Cancer',
            'description': 'Malignant tumor in lung tissue',
            'severity': 'high',
            'confidence': 0.91,
            'subtype': random.choice(['Non-Small Cell Lung Cancer', 'Small Cell Lung Cancer', 'Adenocarcinoma', 'Squamous Cell Carcinoma'])
        },
        'pneumonia': {
            'name': 'Pneumonia',
            'description': 'Inflammation of lung tissue, usually infectious',
            'severity': 'medium',
            'confidence': 0.88,
            'subtype': random.choice(['Bacterial Pneumonia', 'Viral Pneumonia', 'Fungal Pneumonia'])
        },
        'tuberculosis': {
            'name': 'Tuberculosis',
            'description': 'Bacterial infection primarily affecting lungs',
            'severity': 'high',
            'confidence': 0.93,
            'subtype': 'Pulmonary Tuberculosis'
        },
        'pulmonary_nodules': {
            'name': 'Pulmonary Nodules',
            'description': 'Small round spots in the lungs',
            'severity': 'low',
            'confidence': 0.85,
            'subtype': random.choice(['Benign Nodules', 'Indeterminate Nodules'])
        }
    },
    'abdomen': {
        'normal': {
            'name': 'Normal',
            'description': 'No abnormalities detected',
            'severity': 'none',
            'confidence': 0.93
        },
        'liver_tumor': {
            'name': 'Liver Tumor',
            'description': 'Abnormal growth in liver tissue',
            'severity': 'high',
            'confidence': 0.89,
            'subtype': random.choice(['Hepatocellular Carcinoma', 'Liver Metastasis', 'Hemangioma'])
        },
        'kidney_tumor': {
            'name': 'Kidney Tumor',
            'description': 'Abnormal growth in kidney tissue',
            'severity': 'high',
            'confidence': 0.91,
            'subtype': random.choice(['Renal Cell Carcinoma', 'Transitional Cell Carcinoma'])
        },
        'pancreatic_cancer': {
            'name': 'Pancreatic Cancer',
            'description': 'Malignant tumor of the pancreas',
            'severity': 'high',
            'confidence': 0.87,
            'subtype': random.choice(['Adenocarcinoma', 'Neuroendocrine Tumor'])
        }
    },
    'upperabdomen': {
        'normal': {
            'name': 'Normal',
            'description': 'No abnormalities detected',
            'severity': 'none',
            'confidence': 0.92
        },
        'liver_tumor': {
            'name': 'Liver Tumor',
            'description': 'Abnormal growth in liver tissue',
            'severity': 'high',
            'confidence': 0.88,
            'subtype': random.choice(['Hepatocellular Carcinoma', 'Liver Metastasis', 'Hemangioma'])
        },
        'gallbladder_disease': {
            'name': 'Gallbladder Disease',
            'description': 'Inflammation or stones in gallbladder',
            'severity': 'medium',
            'confidence': 0.90,
            'subtype': random.choice(['Cholecystitis', 'Gallstones', 'Gallbladder Cancer'])
        }
    },
    'humanneck': {
        'normal': {
            'name': 'Normal',
            'description': 'No abnormalities detected',
            'severity': 'none',
            'confidence': 0.94
        },
        'thyroid_nodule': {
            'name': 'Thyroid Nodule',
            'description': 'Abnormal growth in thyroid gland',
            'severity': 'low',
            'confidence': 0.86,
            'subtype': random.choice(['Benign Nodule', 'Suspicious Nodule', 'Malignant Nodule'])
        },
        'throat_cancer': {
            'name': 'Throat Cancer',
            'description': 'Malignant tumor in throat region',
            'severity': 'high',
            'confidence': 0.89,
            'subtype': random.choice(['Laryngeal Cancer', 'Pharyngeal Cancer', 'Thyroid Cancer'])
        }
    },
    'fullbody': {
        'normal': {
            'name': 'Normal',
            'description': 'No abnormalities detected',
            'severity': 'none',
            'confidence': 0.91
        },
        'metastatic_cancer': {
            'name': 'Metastatic Cancer',
            'description': 'Cancer that has spread to multiple body regions',
            'severity': 'high',
            'confidence': 0.88,
            'subtype': 'Multiple Metastases'
        },
        'lymphoma': {
            'name': 'Lymphoma',
            'description': 'Cancer of the lymphatic system',
            'severity': 'high',
            'confidence': 0.90,
            'subtype': random.choice(['Hodgkin Lymphoma', 'Non-Hodgkin Lymphoma'])
        }
    }
}


@classification_bp.route('/classify', methods=['POST'])
def classify_scan():
    """
    Classify disease from uploaded scan.
    
    In production, this would:
    1. Load the processed DICOM images
    2. Run them through a trained ML model
    3. Return the classification results
    
    For now, this is a simulation that returns realistic-looking results.
    """
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')
    body_part = data.get('body_part', 'brain')
    
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400
    
    # Get available diseases for this body part
    available_diseases = DISEASE_CLASSIFICATIONS.get(body_part, DISEASE_CLASSIFICATIONS['brain'])
    
    # Simulate classification with some randomness
    # 50% chance of normal, 50% chance of disease for testing purposes
    is_normal = random.random() < 0.5
    
    if is_normal:
        classification = available_diseases['normal'].copy()
    else:
        # Pick a random disease (excluding 'normal')
        disease_keys = [k for k in available_diseases.keys() if k != 'normal']
        if disease_keys:
            disease_key = random.choice(disease_keys)
            classification = available_diseases[disease_key].copy()
        else:
            classification = available_diseases['normal'].copy()
    
    # Add some random variation to confidence
    classification['confidence'] = round(classification['confidence'] + random.uniform(-0.05, 0.05), 2)
    classification['confidence'] = max(0.7, min(0.99, classification['confidence']))
    
    return jsonify({
        'session_id': session_id,
        'body_part': body_part,
        'classification': classification,
        'note': 'This is a simulated classification. In production, a trained ML model would be used.'
    })


@classification_bp.route('/classify/<session_id>', methods=['GET'])
def get_classification(session_id):
    """Get existing classification for a session."""
    data = request.args.to_dict()
    body_part = data.get('body_part', 'brain')
    
    available_diseases = DISEASE_CLASSIFICATIONS.get(body_part, DISEASE_CLASSIFICATIONS['brain'])
    classification = available_diseases['normal'].copy()
    
    return jsonify({
        'session_id': session_id,
        'body_part': body_part,
        'classification': classification,
        'note': 'This is a simulated classification. In production, a trained ML model would be used.'
    })
