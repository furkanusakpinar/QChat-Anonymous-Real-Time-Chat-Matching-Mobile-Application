// Utility helper functions

export const formatTimer = (seconds) => {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const generateRandomNickname = () => {
  const adjectives = ['Cyber', 'Neon', 'Cosmic', 'Silent', 'Mystic', 'Nova', 'Lunar', 'Velvet', 'Shadow', 'Quantum'];
  const nouns = ['Traveler', 'Echo', 'Wanderer', 'Pulse', 'Cipher', 'Vortex', 'Phoenix', 'Beacon', 'Drifter', 'Nomad'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}_${num}`;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
