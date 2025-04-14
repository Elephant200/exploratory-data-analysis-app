document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('video');
    const loadingSpinner = document.querySelector('.video-loading');
    
    if (video && loadingSpinner) {
        // Show loading spinner when video starts loading
        video.addEventListener('loadstart', function() {
            loadingSpinner.style.display = 'block';
        });
        
        // Hide loading spinner when video can play
        video.addEventListener('canplay', function() {
            loadingSpinner.style.display = 'none';
        });
        
        // Handle video errors
        video.addEventListener('error', function() {
            loadingSpinner.style.display = 'none';
            console.error('Error loading video:', video.error);
        });
    }
});
