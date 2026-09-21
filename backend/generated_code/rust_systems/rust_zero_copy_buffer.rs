//! Zero-Copy Memory Slice Packet Parser in Rust
//! Module: rust_zero_copy_buffer_24_3e4998 | Packet Magic: 0x4E455855

pub struct PacketHeader {
    pub magic: u32,
    pub length: u32,
    pub payload_type: u16,
}

impl PacketHeader {
    pub fn parse(buf: &[u8]) -> Result<Self, &'static str> {
        if buf.len() < 10 {
            return Err("Buffer too small for packet header");
        }
        let magic = u32::from_be_bytes([buf[0], buf[1], buf[2], buf[3]]);
        let length = u32::from_be_bytes([buf[4], buf[5], buf[6], buf[7]]);
        let payload_type = u16::from_be_bytes([buf[8], buf[9]]);
        Ok(PacketHeader { magic, length, payload_type })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_header_parse() {
        let raw = [0x4E, 0x45, 0x58, 0x55, 0x00, 0x00, 0x01, 0x00, 0x00, 0x01];
        let header = PacketHeader::parse(&raw).unwrap();
        assert_eq!(header.magic, 0x4E455855);
        assert_eq!(header.length, 256);
        assert_eq!(header.payload_type, 1);
    }
}
