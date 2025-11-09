// 🎥 Video Type
export type Video = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
};

// 🏀 Player Highlights
export const playerHighlights: Video[] = [
  {
    id: "1",
    title: "Court Champ’s Game Winner",
    url: "https://www.youtube.com/watch?v=abc123",
    thumbnailUrl: "/thumbnails/game-winner.jpg",
  },
  {
    id: "2",
    title: "Behind-the-Back Pass Compilation",
    url: "https://www.youtube.com/watch?v=def456",
    thumbnailUrl: "/thumbnails/behind-pass.jpg",
  },
  {
    id: "3",
    title: "M2DG All-Star Highlights",
    url: "https://www.youtube.com/watch?v=ghi789",
    thumbnailUrl: "/thumbnails/all-star.jpg",
  },
];

// 🎧 Owner’s Playlist
export const ownerPlayList: Video[] = [
  {
    id: "4",
    title: "Rise and Grind Mix",
    url: "https://www.youtube.com/watch?v=jkl012",
    thumbnailUrl: "/thumbnails/rise-grind.jpg",
  },
  {
    id: "5",
    title: "Late Night Focus Tracks",
    url: "https://www.youtube.com/watch?v=mno345",
    thumbnailUrl: "/thumbnails/focus-tracks.jpg",
  },
  {
    id: "6",
    title: "Game Day Energy Vibes",
    url: "https://www.youtube.com/watch?v=pqr678",
    thumbnailUrl: "/thumbnails/energy-vibes.jpg",
  },
];

// 💬 Motivational Speeches
export const motivationalSpeeches: Video[] = [
  {
    id: "7",
    title: "Stay Locked In – Coach’s Speech",
    url: "https://www.youtube.com/watch?v=stu901",
    thumbnailUrl: "/thumbnails/stay-locked.jpg",
  },
  {
    id: "8",
    title: "Never Back Down Mentality",
    url: "https://www.youtube.com/watch?v=vwx234",
    thumbnailUrl: "/thumbnails/never-back.jpg",
  },
  {
    id: "9",
    title: "Push Past Limits",
    url: "https://www.youtube.com/watch?v=yz1234",
    thumbnailUrl: "/thumbnails/push-limits.jpg",
  },
];
