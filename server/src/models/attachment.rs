/// Email attachment structure
#[derive(Debug, Clone)]
pub struct EmailAttachment {
    /// Attachment filename
    pub filename: String,
    /// Attachment content type (MIME type)
    pub content_type: String,
    /// Attachment data
    pub data: Vec<u8>,
    /// Attachment size in bytes
    pub size: usize,
}

impl EmailAttachment {
    /// Create a new attachment
    pub fn new(filename: String, content_type: String, data: Vec<u8>) -> Self {
        let size = data.len();
        Self {
            filename,
            content_type,
            data,
            size,
        }
    }

    /// Check if attachment size exceeds limit
    pub fn exceeds_limit(&self, max_size: u64) -> bool {
        self.size as u64 > max_size
    }
}

