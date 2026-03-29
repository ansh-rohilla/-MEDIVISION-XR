from flask import Blueprint, jsonify

labels_bp = Blueprint('labels', __name__)

# Medical-grade organ label data with accurate anatomical positioning
# Coordinates are normalized percentages (x, y) for precise organ location
ORGAN_LABELS = {
    'abdomen': [
        {
            'name': 'Liver',
            'x': 35,
            'y': 30,
            'side': 'left',
            'type': 'normal',
            'description': 'Largest internal organ, filters blood and produces bile'
        },
        {
            'name': 'Stomach',
            'x': 55,
            'y': 40,
            'side': 'right',
            'type': 'normal',
            'description': 'Digests food and produces enzymes'
        },
        {
            'name': 'Pancreas',
            'x': 50,
            'y': 48,
            'side': 'center',
            'type': 'normal',
            'description': 'Produces insulin and digestive enzymes'
        },
        {
            'name': 'Gallbladder',
            'x': 42,
            'y': 38,
            'side': 'left',
            'type': 'normal',
            'description': 'Stores and concentrates bile'
        },
        {
            'name': 'Large Intestine',
            'x': 30,
            'y': 65,
            'side': 'left',
            'type': 'normal',
            'description': 'Absorbs water and forms stool'
        },
        {
            'name': 'Small Intestine',
            'x': 55,
            'y': 62,
            'side': 'right',
            'type': 'normal',
            'description': 'Primary site of nutrient absorption'
        },
        {
            'name': 'Esophagus',
            'x': 50,
            'y': 18,
            'side': 'center',
            'type': 'normal',
            'description': 'Transports food from mouth to stomach'
        }
    ],
    'upperabdomen': [
        {
            'name': 'Liver',
            'x': 35,
            'y': 30,
            'side': 'left',
            'type': 'normal',
            'description': 'Largest internal organ, filters blood and produces bile'
        },
        {
            'name': 'Stomach',
            'x': 55,
            'y': 40,
            'side': 'right',
            'type': 'normal',
            'description': 'Digests food and produces enzymes'
        },
        {
            'name': 'Pancreas',
            'x': 50,
            'y': 48,
            'side': 'center',
            'type': 'normal',
            'description': 'Produces insulin and digestive enzymes'
        },
        {
            'name': 'Gallbladder',
            'x': 42,
            'y': 38,
            'side': 'left',
            'type': 'normal',
            'description': 'Stores and concentrates bile'
        },
        {
            'name': 'Large Intestine',
            'x': 30,
            'y': 65,
            'side': 'left',
            'type': 'normal',
            'description': 'Absorbs water and forms stool'
        },
        {
            'name': 'Small Intestine',
            'x': 55,
            'y': 62,
            'side': 'right',
            'type': 'normal',
            'description': 'Primary site of nutrient absorption'
        },
        {
            'name': 'Esophagus',
            'x': 50,
            'y': 18,
            'side': 'center',
            'type': 'normal',
            'description': 'Transports food from mouth to stomach'
        }
    ],
    'chest': [
        {
            'name': 'Trachea',
            'x': 45,
            'y': 15,
            'side': 'right',
            'type': 'normal',
            'category': 'airways',
            'description': 'Windpipe connecting to bronchi'
        },
        {
            'name': 'Ribs',
            'x': 15,
            'y': 40,
            'side': 'left',
            'type': 'normal',
            'category': 'bones',
            'description': 'Protective cage around lungs and heart'
        },
        {
            'name': 'Right Lung',
            'x': 25,
            'y': 50,
            'side': 'left',
            'type': 'normal',
            'category': 'lungs',
            'description': 'Right respiratory organ with 3 lobes'
        },
        {
            'name': 'Aorta',
            'x': 50,
            'y': 45,
            'side': 'right',
            'type': 'normal',
            'category': 'vascular',
            'description': 'Main artery carrying oxygenated blood'
        },
        {
            'name': 'Left Lung',
            'x': 75,
            'y': 50,
            'side': 'right',
            'type': 'normal',
            'category': 'lungs',
            'description': 'Left respiratory organ with 2 lobes'
        },
        {
            'name': 'Heart',
            'x': 48,
            'y': 65,
            'side': 'right',
            'type': 'normal',
            'category': 'vascular',
            'description': 'Central pumping organ with 4 chambers'
        }
    ],
    'humanneck': [
        {
            'name': 'Trachea',
            'x': 50,
            'y': 55,
            'side': 'center',
            'type': 'normal',
            'description': 'Windpipe conducting air to lungs'
        },
        {
            'name': 'Thyroid',
            'x': 50,
            'y': 40,
            'side': 'center',
            'type': 'normal',
            'description': 'Regulates metabolism'
        },
        {
            'name': 'Carotid Artery Left',
            'x': 40,
            'y': 45,
            'side': 'left',
            'type': 'normal',
            'description': 'Supplies blood to left brain hemisphere'
        },
        {
            'name': 'Carotid Artery Right',
            'x': 60,
            'y': 45,
            'side': 'right',
            'type': 'normal',
            'description': 'Supplies blood to right brain hemisphere'
        },
        {
            'name': 'Cervical Spine',
            'x': 50,
            'y': 60,
            'side': 'center',
            'type': 'normal',
            'description': 'Neck vertebrae protecting spinal cord'
        },
        {
            'name': 'Jugular Vein',
            'x': 38,
            'y': 42,
            'side': 'left',
            'type': 'normal',
            'description': 'Drains blood from head and neck'
        }
    ],
    'fullbody': [
        {
            'name': 'Spine',
            'x': 50,
            'y': 50,
            'side': 'center',
            'type': 'normal',
            'description': 'Central support structure and nerve pathway'
        },
        {
            'name': 'Pelvis',
            'x': 50,
            'y': 70,
            'side': 'center',
            'type': 'normal',
            'description': 'Protects reproductive organs and supports spine'
        },
        {
            'name': 'Femur',
            'x': 45,
            'y': 80,
            'side': 'left',
            'type': 'normal',
            'description': 'Thigh bone, longest bone in body'
        },
        {
            'name': 'Ribcage',
            'x': 50,
            'y': 35,
            'side': 'center',
            'type': 'normal',
            'description': 'Protects heart and lungs'
        },
        {
            'name': 'Skull',
            'x': 50,
            'y': 15,
            'side': 'center',
            'type': 'normal',
            'description': 'Protects brain and sensory organs'
        }
    ],
    'brain': [
        {
            'name': 'Cerebrum',
            'x': 50,
            'y': 30,
            'side': 'center',
            'type': 'normal',
            'category': 'organs',
            'description': 'Largest part of brain responsible for higher functions'
        },
        {
            'name': 'Cerebellum',
            'x': 50,
            'y': 65,
            'side': 'center',
            'type': 'normal',
            'category': 'organs',
            'description': 'Coordinates movement and balance'
        },
        {
            'name': 'Brainstem',
            'x': 50,
            'y': 80,
            'side': 'center',
            'type': 'normal',
            'category': 'organs',
            'description': 'Controls vital functions like breathing and heart rate'
        },
        {
            'name': 'Frontal Lobe',
            'x': 35,
            'y': 25,
            'side': 'left',
            'type': 'normal',
            'category': 'organs',
            'description': 'Responsible for reasoning and motor control'
        },
        {
            'name': 'Parietal Lobe',
            'x': 65,
            'y': 25,
            'side': 'right',
            'type': 'normal',
            'category': 'organs',
            'description': 'Processes sensory information and spatial awareness'
        },
        {
            'name': 'Temporal Lobe',
            'x': 30,
            'y': 45,
            'side': 'left',
            'type': 'normal',
            'category': 'organs',
            'description': 'Processes auditory information and memory'
        },
        {
            'name': 'Occipital Lobe',
            'x': 70,
            'y': 45,
            'side': 'right',
            'type': 'normal',
            'category': 'organs',
            'description': 'Processes visual information'
        },
        {
            'name': 'Thalamus',
            'x': 50,
            'y': 50,
            'side': 'center',
            'type': 'normal',
            'category': 'organs',
            'description': 'Relays sensory and motor signals'
        },
        {
            'name': 'Hypothalamus',
            'x': 45,
            'y': 55,
            'side': 'left',
            'type': 'normal',
            'category': 'organs',
            'description': 'Regulates hormones and autonomic functions'
        },
        {
            'name': 'Pituitary Gland',
            'x': 55,
            'y': 55,
            'side': 'right',
            'type': 'normal',
            'category': 'organs',
            'description': 'Master gland controlling endocrine system'
        },
        {
            'name': 'Corpus Callosum',
            'x': 50,
            'y': 40,
            'side': 'center',
            'type': 'normal',
            'category': 'organs',
            'description': 'Connects left and right brain hemispheres'
        },
        {
            'name': 'Pons',
            'x': 48,
            'y': 70,
            'side': 'left',
            'type': 'normal',
            'category': 'organs',
            'description': 'Part of brainstem linking to cerebellum'
        },
        {
            'name': 'Medulla Oblongata',
            'x': 52,
            'y': 75,
            'side': 'right',
            'type': 'normal',
            'category': 'organs',
            'description': 'Controls vital autonomic functions'
        }
    ],
    'tumor': [
        {
            'name': 'Tumor Region',
            'x': 50,
            'y': 50,
            'side': 'center',
            'type': 'tumor',
            'description': 'Abnormal tissue growth requiring attention'
        }
    ]
}

@labels_bp.route('/labels/<body_part>')
def get_labels(body_part):
    """
    Get organ labels for a specific body part.
    
    Args:
        body_part: The body region (abdomen, chest, humanneck, fullbody, tumor, etc.)
    
    Returns:
        JSON response with labels containing organ names and normalized coordinates
    """
    # Normalize body_part to lowercase for case-insensitive matching
    body_part_normalized = body_part.lower()
    
    # Try to find matching labels
    labels = ORGAN_LABELS.get(body_part_normalized, [])
    
    # If no exact match, try partial matching
    if not labels:
        for key, value in ORGAN_LABELS.items():
            if body_part_normalized in key or key in body_part_normalized:
                labels = value
                break
    
    return jsonify({
        'labels': labels,
        'body_part': body_part,
        'count': len(labels)
    })
