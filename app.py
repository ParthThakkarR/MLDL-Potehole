"""
Flask Web Application for Pothole Detection using YOLOv8

This application provides a web interface for uploading images and detecting
potholes using a trained YOLOv8 model.
"""

import os
import json
import cv2
import threading
import time
import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, Response, jsonify
from werkzeug.utils import secure_filename
from ultralytics import YOLO

# Configuration
app = Flask(__name__)
app.secret_key = 'pothole_detection_secret_key'

# Get the project base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
RESULTS_FOLDER = os.path.join(BASE_DIR, 'results')
MODEL_PATH = os.path.join(BASE_DIR, 'pothole_yolo', 'pothole_yolo', 'train1', 'weights', 'best.pt')

# Allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}

# Global variables for live video streaming
is_processing_live = False
current_video_path = None
video_lock = threading.Lock()
current_detection_count = 0  # Track current frame's detection count

# Detection settings (stored persistently)
SETTINGS_FILE = os.path.join(BASE_DIR, 'settings.json')

# Default settings
default_settings = {
    'confidence_threshold': 0.25,
    'line_thickness': 4,
    'show_labels': True,
    'show_conf': True
}

# Load settings from file or use defaults
def load_settings():
    """Load settings from JSON file, or return defaults if file doesn't exist."""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return default_settings.copy()

# Save settings to file
def save_settings(settings):
    """Save settings to JSON file."""
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f)

# Initialize settings
detection_settings = load_settings()

# Get current values from settings
CONFIDENCE_THRESHOLD = detection_settings.get('confidence_threshold', 0.25)
LINE_THICKNESS = detection_settings.get('line_thickness', 4)
SHOW_LABELS = detection_settings.get('show_labels', True)
SHOW_CONF = detection_settings.get('show_conf', True)

# Detection statistics
detection_stats = {
    'total_detections': 0,
    'images_processed': 0,
    'videos_processed': 0,
    'detection_history': [],  # List of {'timestamp': str, 'count': int}
}

# Detection history file
HISTORY_FILE = os.path.join(BASE_DIR, 'detection_history.json')

# Load stats from file if exists
def load_detection_stats():
    """Load detection stats from JSON file."""
    global detection_stats
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r') as f:
                detection_stats = json.load(f)
        except:
            pass

# Save stats to file
def save_detection_stats():
    """Save detection stats to JSON file."""
    with open(HISTORY_FILE, 'w') as f:
        json.dump(detection_stats, f)

# Load stats on startup
load_detection_stats()

# Configure Flask
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size (increased from 16MB)

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'video_uploads'), exist_ok=True)

# Load YOLOv8 model
print(f"Loading model from: {MODEL_PATH}")
try:
    model = YOLO(MODEL_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None


def allowed_file(filename):
    """
    Check if the uploaded file has an allowed extension.
    
    Args:
        filename: Name of the file to check
        
    Returns:
        bool: True if file extension is allowed, False otherwise
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_extension(filename):
    """
    Get the file extension from a filename.
    
    Args:
        filename: Name of the file
        
    Returns:
        str: File extension in lowercase
    """
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


def allowed_video_file(filename):
    """
    Check if the uploaded file is an allowed video file.
    
    Args:
        filename: Name of the video file
        
    Returns:
        bool: True if video extension is allowed, False otherwise
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS


@app.route('/')
def index():
    """
    Render the main page with the upload form.
    
    Returns:
        Rendered HTML template
    """
    return render_template('index.html')


def process_video_generator(video_path):
    """
    Process video frame-by-frame using YOLO model and yield processed frames.
    
    Args:
        video_path: Path to the video file
        
    Yields:
        JPEG frames as multipart response
    """
    global is_processing_live, detection_stats, current_detection_count
    import datetime
    
    # Track video as being processed
    detection_stats['videos_processed'] += 1
    save_detection_stats()
    
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        return
    
    try:
        frame_count = 0
        while is_processing_live:
            # Reload settings every 30 frames to get fresh settings
            frame_count += 1
            if frame_count % 30 == 0:
                current_settings = load_settings()
                global CONFIDENCE_THRESHOLD, LINE_THICKNESS, SHOW_LABELS, SHOW_CONF
                CONFIDENCE_THRESHOLD = current_settings.get('confidence_threshold', 0.25)
                LINE_THICKNESS = current_settings.get('line_thickness', 4)
                SHOW_LABELS = current_settings.get('show_labels', True)
                SHOW_CONF = current_settings.get('show_conf', True)
            
            ret, frame = cap.read()
            
            if not ret:
                # Loop back to the beginning if video ended
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            # Run YOLO inference on the frame using current settings
            results = model.predict(
                source=frame,
                conf=CONFIDENCE_THRESHOLD,
                verbose=False,
                show_labels=SHOW_LABELS,
                show_conf=SHOW_CONF
            )
            
            # Draw blue bounding boxes around detected potholes
            frame_detections = 0
            if results and len(results) > 0:
                result = results[0]
                if result.boxes is not None:
                    boxes = result.boxes
                    frame_detections = len(boxes)
                    for box in boxes:
                        # Get box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                        
                        # Get confidence score
                        conf = float(box.conf[0])
                        
                        # Draw blue bounding box (BGR: 255, 0, 0) using dynamic line thickness
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), LINE_THICKNESS)
                        
                        # Add label with confidence if enabled
                        label = ''
                        if SHOW_LABELS:
                            label = 'Pothole'
                        if SHOW_CONF:
                            label = f'{label} {conf:.2f}' if label else f'{conf:.2f}'
                        
                        # Only draw label if there's content
                        if label:
                            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                            cv2.rectangle(frame, (x1, y1 - label_size[1] - 10), (x1 + label_size[0], y1), (255, 0, 0), -1)
                            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
            
            # Draw detection count in the corner of the frame
            count_text = f'Potholes: {frame_detections}'
            cv2.putText(frame, count_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Update global detection count for the API
            current_detection_count = frame_detections
            
            # Add to detection history every 30 frames (about every second)
            if frame_count % 30 == 0 and frame_detections > 0:
                detection_stats['total_detections'] += frame_detections
                detection_stats['detection_history'].append({
                    'timestamp': datetime.datetime.now().isoformat(),
                    'count': frame_detections,
                    'type': 'video',
                    'filename': os.path.basename(video_path) if video_path else 'video'
                })
                # Keep only last 100 entries
                if len(detection_stats['detection_history']) > 100:
                    detection_stats['detection_history'] = detection_stats['detection_history'][-100:]
                save_detection_stats()
            
            # Encode frame as JPEG
            ret, jpeg = cv2.imencode('.jpg', frame)
            
            if not ret:
                continue
            
            # Yield frame in multipart response format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
    
    finally:
        cap.release()


@app.route('/start_live_video', methods=['POST'])
def start_live_video():
    """
    Handle video file upload for live streaming.
    
    Returns:
        JSON response with status and video filename
    """
    global is_processing_live, current_video_path
    
    # Check if model is loaded
    if model is None:
        return jsonify({'error': 'Model not loaded. Please check the model path.'}), 500
    
    # Check if file part exists
    if 'video' not in request.files:
        return jsonify({'error': 'No video file part in the request.'}), 400
    
    video_file = request.files['video']
    
    # Check if file was selected
    if video_file.filename == '':
        return jsonify({'error': 'No video file selected.'}), 400
    
    # Validate file
    if not allowed_video_file(video_file.filename):
        return jsonify({'error': 'Invalid video file type. Please upload a video (mp4, avi, mov, mkv, webm).'}), 400
    
    try:
        # Secure the filename
        filename = secure_filename(video_file.filename)
        
        # Create video uploads folder if it doesn't exist
        video_upload_folder = os.path.join(BASE_DIR, 'video_uploads')
        os.makedirs(video_upload_folder, exist_ok=True)
        
        # Save the video file
        video_path = os.path.join(video_upload_folder, filename)
        video_file.save(video_path)
        
        # Set global variables
        with video_lock:
            current_video_path = video_path
            is_processing_live = True
        
        return jsonify({
            'success': True,
            'message': 'Video uploaded successfully',
            'filename': filename
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing video: {str(e)}'}), 500


@app.route('/stop_live_video', methods=['POST'])
def stop_live_video():
    """
    Stop the live video processing.
    
    Returns:
        JSON response with status
    """
    global is_processing_live, current_video_path
    
    with video_lock:
        is_processing_live = False
        current_video_path = None
    
    return jsonify({'success': True, 'message': 'Video streaming stopped'})


@app.route('/video_feed/<filename>')
def video_feed(filename):
    """
    Stream processed video frames.
    
    Args:
        filename: Name of the video file
        
    Returns:
        Multipart response with JPEG frames
    """
    global is_processing_live, current_video_path
    
    # Construct the video path
    video_upload_folder = os.path.join(BASE_DIR, 'video_uploads')
    video_path = os.path.join(video_upload_folder, secure_filename(filename))
    
    # Check if video file exists
    if not os.path.exists(video_path):
        return "Video file not found", 404
    
    # Start processing
    with video_lock:
        if not is_processing_live:
            is_processing_live = True
        current_video_path = video_path
    
    return Response(
        process_video_generator(video_path),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Handle file upload, run inference, and display results.
    
    Returns:
        Redirect to index with results or error message
    """
    # Check if model is loaded
    if model is None:
        flash('Error: Model not loaded. Please check the model path.', 'error')
        return redirect(url_for('index'))
    
    # Check if file part exists
    if 'file' not in request.files:
        flash('No file part in the request.', 'error')
        return redirect(url_for('index'))
    
    file = request.files['file']
    
    # Check if file was selected
    if file.filename == '':
        flash('No file selected.', 'error')
        return redirect(url_for('index'))
    
    # Validate file
    if not allowed_file(file.filename):
        flash('Invalid file type. Please upload an image (jpg, jpeg, png, gif, bmp, webp).', 'error')
        return redirect(url_for('index'))
    
    try:
        start_time = time.time()
        # Secure the filename and create unique name
        # ... (rest of filename logic)
        original_filename = secure_filename(file.filename)
        filename = original_filename
        counter = 1
        while os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
            name, ext = os.path.splitext(original_filename)
            filename = f"{name}_{counter}{ext}"
            counter += 1
        
        # Save uploaded file
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(upload_path)
        
        # Run inference with visible bounding boxes using current settings
        results = model.predict(
            source=upload_path,
            conf=CONFIDENCE_THRESHOLD,
            save=True,
            project=RESULTS_FOLDER,
            name='output',
            exist_ok=True,
            line_width=LINE_THICKNESS,
            show_labels=SHOW_LABELS,
            show_conf=SHOW_CONF
        )
        
        processing_time = (time.time() - start_time) * 1000 # in ms

        # Get the result image path
        result_filename = f"{os.path.splitext(filename)[0]}.jpg"
        result_path = os.path.join(RESULTS_FOLDER, 'output', result_filename)
        
        # If result doesn't exist, try with the original extension
        if not os.path.exists(result_path):
            result_filename = filename
            result_path = os.path.join(RESULTS_FOLDER, 'output', result_filename)
        
        # If still not found, look for any jpg/png in the output folder
        if not os.path.exists(result_path):
            output_dir = os.path.join(RESULTS_FOLDER, 'output')
            if os.path.exists(output_dir):
                for f in os.listdir(output_dir):
                    if f.endswith(('.jpg', '.png', '.jpeg')):
                        result_filename = f
                        result_path = os.path.join(output_dir, f)
                        break
        
        # Count detections and get confidence distribution
        num_detections = 0
        avg_conf = 0
        conf_dist = {'high': 0, 'medium': 0, 'low': 0}
        
        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None:
                num_detections = len(result.boxes)
                conf_scores = result.boxes.conf.cpu().numpy().tolist()
                if conf_scores:
                    avg_conf = sum(conf_scores) / len(conf_scores)
                    for conf in conf_scores:
                        if conf >= 0.8: conf_dist['high'] += 1
                        elif conf >= 0.5: conf_dist['medium'] += 1
                        else: conf_dist['low'] += 1
                    
                    # Convert to percentages for the template
                    total = len(conf_scores)
                    for key in conf_dist:
                        conf_dist[key] = (conf_dist[key] / total) * 100
        
        # Update detection statistics
        import datetime
        detection_stats['total_detections'] += num_detections
        detection_stats['images_processed'] += 1
        detection_stats['detection_history'].append({
            'timestamp': datetime.datetime.now().isoformat(),
            'count': num_detections,
            'type': 'image',
            'filename': filename,
            'confidence': avg_conf,
            'processing_time': processing_time
        })
        # Keep only last 100 entries
        if len(detection_stats['detection_history']) > 100:
            detection_stats['detection_history'] = detection_stats['detection_history'][-100:]
        
        # Save stats to file for persistence
        save_detection_stats()
        
        # Prepare URLs for display - use direct file paths
        # The uploads folder is served from the uploads directory
        # Results are served from the results directory
        original_url = url_for('uploaded_file', filename=filename)
        result_url = url_for('result_file', filename=f'output/{result_filename}')
        
        return render_template(
            'index.html',
            original_image=original_url,
            result_image=result_url,
            num_detections=num_detections,
            avg_confidence=round(avg_conf * 100, 1),
            processing_time=round(processing_time),
            conf_dist=conf_dist,
            filename=filename
        )
        
    except Exception as e:
        flash(f'Error processing image: {str(e)}', 'error')
        return redirect(url_for('index'))


@app.route('/upload_ajax', methods=['POST'])
def upload_ajax():
    """
    Handle file upload and return results as JSON for AJAX requests.
    """
    if model is None:
        return jsonify({'success': False, 'error': 'Model not loaded'})
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'})
    
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'Invalid file type'})
    
    try:
        start_time = time.time()
        original_filename = secure_filename(file.filename)
        filename = original_filename
        counter = 1
        while os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
            name, ext = os.path.splitext(original_filename)
            filename = f"{name}_{counter}{ext}"
            counter += 1
        
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(upload_path)
        
        results = model.predict(
            source=upload_path,
            conf=CONFIDENCE_THRESHOLD,
            save=True,
            project=RESULTS_FOLDER,
            name='output',
            exist_ok=True,
            line_width=LINE_THICKNESS,
            show_labels=SHOW_LABELS,
            show_conf=SHOW_CONF
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        result_filename = f"{os.path.splitext(filename)[0]}.jpg"
        result_path = os.path.join(RESULTS_FOLDER, 'output', result_filename)
        
        if not os.path.exists(result_path):
            result_filename = filename
            result_path = os.path.join(RESULTS_FOLDER, 'output', result_filename)
        
        if not os.path.exists(result_path):
            output_dir = os.path.join(RESULTS_FOLDER, 'output')
            if os.path.exists(output_dir):
                for f in os.listdir(output_dir):
                    if f.endswith(('.jpg', '.png', '.jpeg')):
                        result_filename = f
                        break
        
        num_detections = 0
        avg_conf = 0
        conf_dist = {'high': 0, 'medium': 0, 'low': 0}
        
        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None:
                num_detections = len(result.boxes)
                conf_scores = result.boxes.conf.cpu().numpy().tolist()
                if conf_scores:
                    avg_conf = sum(conf_scores) / len(conf_scores)
                    for conf in conf_scores:
                        if conf >= 0.8: conf_dist['high'] += 1
                        elif conf >= 0.5: conf_dist['medium'] += 1
                        else: conf_dist['low'] += 1
                    
                    total = len(conf_scores)
                    for key in conf_dist:
                        conf_dist[key] = (conf_dist[key] / total) * 100
        
        import datetime
        detection_stats['total_detections'] += num_detections
        detection_stats['images_processed'] += 1
        detection_stats['detection_history'].append({
            'timestamp': datetime.datetime.now().isoformat(),
            'count': num_detections,
            'type': 'image',
            'filename': filename,
            'confidence': avg_conf,
            'processing_time': processing_time
        })
        if len(detection_stats['detection_history']) > 100:
            detection_stats['detection_history'] = detection_stats['detection_history'][-100:]
        
        save_detection_stats()
        
        return jsonify({
            'success': True,
            'original_image': url_for('uploaded_file', filename=filename),
            'result_image': url_for('result_file', filename=f'output/{result_filename}'),
            'num_detections': num_detections,
            'avg_confidence': round(avg_conf * 100, 1),
            'processing_time': round(processing_time),
            'conf_dist': conf_dist
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """
    Serve uploaded files from the uploads directory.
    
    Args:
        filename: Path to the file
        
    Returns:
        File response
    """
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/results/<path:filename>')
def result_file(filename):
    """
    Serve result files from the results directory.
    
    Args:
        filename: Path to the file
        
    Returns:
        File response
    """
    return send_from_directory(RESULTS_FOLDER, filename)


@app.route('/video_uploads/<path:filename>')
def video_upload_file(filename):
    """
    Serve video files from the video uploads directory.
    
    Args:
        filename: Path to the video file
        
    Returns:
        File response
    """
    video_upload_folder = os.path.join(BASE_DIR, 'video_uploads')
    return send_from_directory(video_upload_folder, filename)


@app.errorhandler(413)
def request_entity_too_large(error):
    """
    Handle file size exceeded error.
    
    Returns:
        Error message for file too large
    """
    flash('File too large. Maximum size is 100MB.', 'error')
    return redirect(url_for('index'))


@app.errorhandler(500)
def internal_server_error(error):
    """
    Handle internal server errors.
    
    Returns:
        Error message for internal server error
    """
    flash('Internal server error. Please try again.', 'error')
    return redirect(url_for('index'))


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    Get detection statistics.
    
    Returns:
        JSON response with stats
    """
    global detection_stats
    # Reload from file to ensure we have the latest data
    load_detection_stats()
    response = jsonify(detection_stats)
    # Prevent caching to ensure real-time updates
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/api/settings', methods=['GET'])
def get_settings():
    """
    Get current settings.
    
    Returns:
        JSON response with settings
    """
    global detection_settings, CONFIDENCE_THRESHOLD, LINE_THICKNESS, SHOW_LABELS, SHOW_CONF
    
    # Reload settings from file to get any changes
    detection_settings = load_settings()
    
    # Update module-level variables
    CONFIDENCE_THRESHOLD = detection_settings.get('confidence_threshold', 0.25)
    LINE_THICKNESS = detection_settings.get('line_thickness', 4)
    SHOW_LABELS = detection_settings.get('show_labels', True)
    SHOW_CONF = detection_settings.get('show_conf', True)
    
    return jsonify({
        'confidence_threshold': CONFIDENCE_THRESHOLD,
        'line_thickness': LINE_THICKNESS,
        'show_labels': SHOW_LABELS,
        'show_conf': SHOW_CONF
    })


@app.route('/api/settings', methods=['POST'])
def update_settings():
    """
    Update detection settings.
    
    Returns:
        JSON response with updated settings
    """
    global detection_settings, CONFIDENCE_THRESHOLD, LINE_THICKNESS, SHOW_LABELS, SHOW_CONF
    
    data = request.get_json()
    
    # Update settings dictionary
    if 'confidence_threshold' in data:
        detection_settings['confidence_threshold'] = float(data['confidence_threshold'])
    
    if 'line_thickness' in data:
        detection_settings['line_thickness'] = int(data['line_thickness'])
    
    if 'show_labels' in data:
        detection_settings['show_labels'] = bool(data['show_labels'])
    
    if 'show_conf' in data:
        detection_settings['show_conf'] = bool(data['show_conf'])
    
    # Save to file for persistence
    save_settings(detection_settings)
    
    # Update module-level variables
    CONFIDENCE_THRESHOLD = detection_settings.get('confidence_threshold', 0.25)
    LINE_THICKNESS = detection_settings.get('line_thickness', 4)
    SHOW_LABELS = detection_settings.get('show_labels', True)
    SHOW_CONF = detection_settings.get('show_conf', True)
    
    return jsonify({
        'success': True,
        'confidence_threshold': CONFIDENCE_THRESHOLD,
        'line_thickness': LINE_THICKNESS,
        'show_labels': SHOW_LABELS,
        'show_conf': SHOW_CONF
    })


@app.route('/api/history', methods=['GET'])
def get_history():
    """
    Get detection history.
    
    Returns:
        JSON response with history
    """
    # Reload from file to ensure we have the latest data
    load_detection_stats()
    
    # Return recent history from stats
    recent = detection_stats['detection_history'][-20:] if detection_stats['detection_history'] else []
    return jsonify(recent)


@app.route('/api/detection_count', methods=['GET'])
def get_detection_count():
    """
    Get current frame detection count for live video.
    
    Returns:
        JSON response with detection count
    """
    global current_detection_count, is_processing_live
    return jsonify({
        'count': current_detection_count if is_processing_live else 0,
        'is_streaming': is_processing_live
    })


if __name__ == '__main__':
    """
    Run the Flask application.
    """
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '1') == '1'
    
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Results folder: {RESULTS_FOLDER}")
    print(f"Model path: {MODEL_PATH}")
    print(f"\nStarting Flask server on port {port}...")
    print(f"Go to http://127.0.0.1:{port} to use the application")
    
    app.run(debug=debug, host='0.0.0.0', port=port)
