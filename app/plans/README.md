# QChat Plans & Architecture

## Security Plan
- Client-side AES-256 Symmetric Encryption per chat session.
- SHA-256 Message Integrity Check.
- Dynamic key exchange via Firebase Firestore.

## Matchmaking Rules
1. **International Mode**:
   - Player country != Partner country
   - Language: English mandatory badge & prompt
2. **Local Mode**:
   - Player country == Partner country
   - Language: Any (Native language free chat)
3. **Session Duration**:
   - Timer counts down from 5, 10, 15, or 30 minutes.
   - Upon timer expiry, session ends and auto-archives to History.
