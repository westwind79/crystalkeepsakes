<?php
/**
 * Image Upload Logger
 * Comprehensive logging for customer image uploads
 * 
 * Log file location: /crystal-data/logs/upload-log.txt
 * 
 * Tracks:
 * - File size (original base64 and decoded binary)
 * - File type/format
 * - Upload success/failure status
 * - Write errors and permissions
 * - Server limits (post_max_size, upload_max_filesize, memory_limit)
 * - User agent (browser info)
 * - Request headers
 * - PHP errors
 * - Disk space
 * - Directory permissions
 */

class UploadLogger {
    private $logDir;
    private $logFile;
    private $requestId;
    private $startTime;
    private $logEntries = [];
    
    public function __construct($mainSiteRoot = null) {
        $this->startTime = microtime(true);
        $this->requestId = $this->generateRequestId();
        
        // Determine log directory
        if ($mainSiteRoot) {
            $this->logDir = rtrim($mainSiteRoot, '/') . '/crystal-data/logs/';
        } else {
            // Fallback: relative to this script
            $this->logDir = dirname(__DIR__) . '/crystal-data/logs/';
        }
        
        $this->logFile = $this->logDir . 'upload-log.txt';
        
        // Ensure log directory exists
        $this->ensureLogDirectory();
    }
    
    /**
     * Generate unique request ID for tracking
     */
    private function generateRequestId() {
        return date('Ymd-His') . '-' . substr(uniqid(), -6);
    }
    
    /**
     * Ensure log directory exists with proper permissions
     */
    private function ensureLogDirectory() {
        if (!file_exists($this->logDir)) {
            @mkdir($this->logDir, 0755, true);
        }
        
        // Create .htaccess to protect logs (Apache)
        $htaccess = $this->logDir . '.htaccess';
        if (!file_exists($htaccess)) {
            @file_put_contents($htaccess, "Deny from all\n");
        }
    }
    
    /**
     * Get all relevant server limits
     */
    public function getServerLimits() {
        return [
            'post_max_size' => ini_get('post_max_size'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'max_input_time' => ini_get('max_input_time'),
            'max_input_vars' => ini_get('max_input_vars'),
        ];
    }
    
    /**
     * Convert size string (like "8M") to bytes
     */
    public function sizeToBytes($size) {
        $size = trim($size);
        $unit = strtoupper(substr($size, -1));
        $value = (int) $size;
        
        switch ($unit) {
            case 'G': $value *= 1024;
            case 'M': $value *= 1024;
            case 'K': $value *= 1024;
        }
        
        return $value;
    }
    
    /**
     * Format bytes to human readable
     */
    public function formatBytes($bytes, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
    
    /**
     * Get disk space info
     */
    public function getDiskInfo($path) {
        $info = [
            'free_space' => 'N/A',
            'total_space' => 'N/A',
            'used_percent' => 'N/A'
        ];
        
        if (function_exists('disk_free_space') && file_exists($path)) {
            $free = @disk_free_space($path);
            $total = @disk_total_space($path);
            
            if ($free !== false && $total !== false) {
                $info['free_space'] = $this->formatBytes($free);
                $info['total_space'] = $this->formatBytes($total);
                $info['used_percent'] = round((($total - $free) / $total) * 100, 1) . '%';
            }
        }
        
        return $info;
    }
    
    /**
     * Get directory permissions info
     */
    public function getDirectoryInfo($path) {
        $info = [
            'exists' => file_exists($path),
            'is_dir' => is_dir($path),
            'is_writable' => is_writable($path),
            'permissions' => 'N/A',
            'owner' => 'N/A'
        ];
        
        if (file_exists($path)) {
            $perms = @fileperms($path);
            if ($perms !== false) {
                $info['permissions'] = substr(sprintf('%o', $perms), -4);
            }
            
            if (function_exists('posix_getpwuid') && function_exists('fileowner')) {
                $owner = @posix_getpwuid(@fileowner($path));
                if ($owner) {
                    $info['owner'] = $owner['name'];
                }
            }
        }
        
        return $info;
    }
    
    /**
     * Get request information
     */
    public function getRequestInfo() {
        return [
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN',
            'ip_address' => $this->getClientIP(),
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'UNKNOWN',
            'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'UNKNOWN',
            'referer' => $_SERVER['HTTP_REFERER'] ?? 'NONE',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'UNKNOWN',
        ];
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // Handle comma-separated IPs
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                return $ip;
            }
        }
        
        return 'UNKNOWN';
    }
    
    /**
     * Log an entry
     */
    public function log($level, $message, $data = []) {
        $entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'elapsed_ms' => round((microtime(true) - $this->startTime) * 1000, 2),
            'level' => $level,
            'message' => $message,
            'data' => $data
        ];
        
        $this->logEntries[] = $entry;
    }
    
    /**
     * Log upload start with all diagnostic info
     */
    public function logUploadStart($imageType, $productId, $orderNumber, $rawInputLength) {
        $serverLimits = $this->getServerLimits();
        $requestInfo = $this->getRequestInfo();
        
        // Check if content length exceeds limits
        $postMaxBytes = $this->sizeToBytes($serverLimits['post_max_size']);
        $contentLength = (int)($requestInfo['content_length'] ?? 0);
        $exceedsLimit = ($contentLength > 0 && $contentLength > $postMaxBytes);
        
        $this->log('INFO', 'UPLOAD_START', [
            'image_type' => $imageType,
            'product_id' => $productId,
            'order_number' => $orderNumber,
            'raw_input_length' => $rawInputLength,
            'raw_input_size' => $this->formatBytes($rawInputLength),
            'content_length_header' => $contentLength,
            'exceeds_post_max' => $exceedsLimit,
            'server_limits' => $serverLimits,
            'request' => $requestInfo,
        ]);
        
        if ($exceedsLimit) {
            $this->log('WARNING', 'CONTENT_EXCEEDS_POST_MAX', [
                'content_length' => $this->formatBytes($contentLength),
                'post_max_size' => $serverLimits['post_max_size'],
            ]);
        }
    }
    
    /**
     * Log image validation result
     */
    public function logImageValidation($base64Length, $binarySize, $detectedMime, $extension) {
        $this->log('INFO', 'IMAGE_VALIDATED', [
            'base64_length' => $base64Length,
            'binary_size_bytes' => $binarySize,
            'binary_size_human' => $this->formatBytes($binarySize),
            'detected_mime' => $detectedMime,
            'extension' => $extension,
        ]);
    }
    
    /**
     * Log directory check
     */
    public function logDirectoryCheck($uploadDir) {
        $dirInfo = $this->getDirectoryInfo($uploadDir);
        $diskInfo = $this->getDiskInfo($uploadDir);
        
        $this->log('INFO', 'DIRECTORY_CHECK', [
            'path' => $uploadDir,
            'directory' => $dirInfo,
            'disk' => $diskInfo,
        ]);
        
        if (!$dirInfo['is_writable']) {
            $this->log('ERROR', 'DIRECTORY_NOT_WRITABLE', [
                'path' => $uploadDir,
                'permissions' => $dirInfo['permissions'],
            ]);
        }
    }
    
    /**
     * Log successful upload
     */
    public function logUploadSuccess($filePath, $fileUrl, $fileSize) {
        $this->log('SUCCESS', 'UPLOAD_COMPLETE', [
            'file_path' => $filePath,
            'file_url' => $fileUrl,
            'file_size_bytes' => $fileSize,
            'file_size_human' => $this->formatBytes($fileSize),
            'file_exists' => file_exists($filePath),
        ]);
    }
    
    /**
     * Log upload failure
     */
    public function logUploadFailure($errorMessage, $errorCode = null, $additionalData = []) {
        $this->log('ERROR', 'UPLOAD_FAILED', array_merge([
            'error_message' => $errorMessage,
            'error_code' => $errorCode,
            'php_last_error' => error_get_last(),
        ], $additionalData));
    }
    
    /**
     * Write all log entries to file
     */
    public function writeLog() {
        $totalTime = round((microtime(true) - $this->startTime) * 1000, 2);
        
        // Build log output
        $output = "\n";
        $output .= "================================================================================\n";
        $output .= "REQUEST ID: {$this->requestId}\n";
        $output .= "TIMESTAMP: " . date('Y-m-d H:i:s') . "\n";
        $output .= "TOTAL TIME: {$totalTime}ms\n";
        $output .= "================================================================================\n";
        
        foreach ($this->logEntries as $entry) {
            $level = str_pad($entry['level'], 8);
            $output .= "[{$entry['timestamp']}] [{$level}] [{$entry['elapsed_ms']}ms] {$entry['message']}\n";
            
            if (!empty($entry['data'])) {
                $output .= $this->formatData($entry['data'], 1);
            }
        }
        
        $output .= "================================================================================\n\n";
        
        // Write to log file
        $result = @file_put_contents($this->logFile, $output, FILE_APPEND | LOCK_EX);
        
        if ($result === false) {
            // Fallback to error_log if file write fails
            error_log("UploadLogger: Failed to write to {$this->logFile}");
            error_log("UploadLogger: " . json_encode($this->logEntries));
        }
        
        return $result !== false;
    }
    
    /**
     * Format data array for log output
     */
    private function formatData($data, $indent = 0) {
        $output = '';
        $prefix = str_repeat('  ', $indent);
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $output .= "{$prefix}  {$key}:\n";
                $output .= $this->formatData($value, $indent + 1);
            } else {
                $output .= "{$prefix}  {$key}: {$value}\n";
            }
        }
        
        return $output;
    }
    
    /**
     * Get path to log file
     */
    public function getLogFilePath() {
        return $this->logFile;
    }
    
    /**
     * Get request ID
     */
    public function getRequestId() {
        return $this->requestId;
    }
    
    /**
     * Static helper to get recent logs
     */
    public static function getRecentLogs($mainSiteRoot, $lines = 100) {
        $logFile = rtrim($mainSiteRoot, '/') . '/crystal-data/logs/upload-log.txt';
        
        if (!file_exists($logFile)) {
            return "No upload log file found at: {$logFile}";
        }
        
        // Read last N lines
        $file = new SplFileObject($logFile, 'r');
        $file->seek(PHP_INT_MAX);
        $lastLine = $file->key();
        
        $startLine = max(0, $lastLine - $lines);
        $output = [];
        
        $file->seek($startLine);
        while (!$file->eof()) {
            $output[] = $file->current();
            $file->next();
        }
        
        return implode('', $output);
    }
}
?>
