export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  description?: string;
  url: string;
  thumbnail?: string;
  duration?: number; // Duration in seconds for videos
}

// Generate 100+ media items with real placeholder URLs
const imageUrls = [
  "https://picsum.photos/800/600",
  "https://picsum.photos/800/600?random=1",
  "https://picsum.photos/800/600?random=2",
  "https://picsum.photos/800/600?random=3",
  "https://picsum.photos/800/600?random=4",
  "https://picsum.photos/800/600?random=5",
  "https://picsum.photos/800/600?random=6",
  "https://picsum.photos/800/600?random=7",
  "https://picsum.photos/800/600?random=8",
  "https://picsum.photos/800/600?random=9",
  "https://picsum.photos/800/600?random=10",
  "https://picsum.photos/800/600?random=11",
  "https://picsum.photos/800/600?random=12",
  "https://picsum.photos/800/600?random=13",
  "https://picsum.photos/800/600?random=14",
  "https://picsum.photos/800/600?random=15",
  "https://picsum.photos/800/600?random=16",
  "https://picsum.photos/800/600?random=17",
  "https://picsum.photos/800/600?random=18",
  "https://picsum.photos/800/600?random=19",
  "https://picsum.photos/800/600?random=20",
  "https://picsum.photos/800/600?random=21",
  "https://picsum.photos/800/600?random=22",
  "https://picsum.photos/800/600?random=23",
  "https://picsum.photos/800/600?random=24",
  "https://picsum.photos/800/600?random=25",
  "https://picsum.photos/800/600?random=26",
  "https://picsum.photos/800/600?random=27",
  "https://picsum.photos/800/600?random=28",
  "https://picsum.photos/800/600?random=29",
  "https://picsum.photos/800/600?random=30",
  "https://picsum.photos/800/600?random=31",
  "https://picsum.photos/800/600?random=32",
  "https://picsum.photos/800/600?random=33",
  "https://picsum.photos/800/600?random=34",
  "https://picsum.photos/800/600?random=35",
  "https://picsum.photos/800/600?random=36",
  "https://picsum.photos/800/600?random=37",
  "https://picsum.photos/800/600?random=38",
  "https://picsum.photos/800/600?random=39",
  "https://picsum.photos/800/600?random=40",
  "https://picsum.photos/800/600?random=41",
  "https://picsum.photos/800/600?random=42",
  "https://picsum.photos/800/600?random=43",
  "https://picsum.photos/800/600?random=44",
  "https://picsum.photos/800/600?random=45",
  "https://picsum.photos/800/600?random=46",
  "https://picsum.photos/800/600?random=47",
  "https://picsum.photos/800/600?random=48",
  "https://picsum.photos/800/600?random=49",
  "https://picsum.photos/800/600?random=50",
];

const videoUrls = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
];

const videoThumbnails = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg",
];

const names = [
  "Mountain Landscape",
  "Ocean Sunset",
  "Forest Path",
  "City Skyline",
  "Desert Dunes",
  "Tropical Beach",
  "Snowy Peaks",
  "Autumn Leaves",
  "Spring Blossoms",
  "Winter Wonderland",
  "Urban Architecture",
  "Rural Countryside",
  "Starry Night",
  "Golden Hour",
  "Misty Morning",
  "Colorful Garden",
  "Abstract Art",
  "Wildlife Portrait",
  "Street Photography",
  "Nature Close-up",
  "Big Buck Bunny",
  "Elephants Dream",
  "For Bigger Blazes",
  "For Bigger Escapes",
  "For Bigger Fun",
  "For Bigger Joyrides",
  "For Bigger Meltdowns",
  "Sintel",
  "Subaru Outback",
  "Tears of Steel",
  "Volkswagen GTI Review",
  "What Car Can You Get",
];

const descriptions = [
  "A breathtaking view of majestic mountains",
  "Beautiful sunset over the ocean horizon",
  "Peaceful path through an ancient forest",
  "Modern cityscape at twilight",
  "Endless sand dunes in the desert",
  "Crystal clear waters and white sand",
  "Snow-capped peaks reaching for the sky",
  "Vibrant autumn colors in nature",
  "Fresh spring flowers in bloom",
  "Serene winter landscape",
  "Stunning architectural masterpiece",
  "Quaint countryside scenery",
  "Mesmerizing night sky full of stars",
  "Perfect lighting during golden hour",
  "Mysterious foggy morning scene",
  "Diverse collection of colorful flowers",
  "Creative abstract composition",
  "Intimate wildlife moment",
  "Captured urban life",
  "Detailed nature macro shot",
  "An animated short film about a rabbit",
  "A dream about elephants",
  "Action-packed adventure video",
  "Escape and adventure content",
  "Fun and entertaining video",
  "Joyful ride experience",
  "Epic meltdown moments",
  "Fantasy adventure film",
  "Car review and test drive",
  "Sci-fi short film",
  "Automotive review content",
  "Car buying guide video",
];

function generateMediaItems(): MediaItem[] {
  const items: MediaItem[] = [];
  let id = 1;

  // Add 60 images
  for (let i = 0; i < 60; i++) {
    const nameIndex = i % 20;
    const currentId = id++;
    // Use seed parameter for consistent images with varied dimensions
    const width = 400 + (i % 3) * 200; // 400, 600, or 800
    const height = 300 + (i % 4) * 150; // 300, 450, 600, or 750
    items.push({
      id: `img-${currentId}`,
      type: "image",
      name: names[nameIndex],
      description: descriptions[nameIndex],
      url: `https://picsum.photos/seed/${currentId}/${width}/${height}`,
    });
  }

  // Add 50 videos
  for (let i = 0; i < 50; i++) {
    const videoIndex = i % videoUrls.length;
    const nameIndex = 20 + (videoIndex % 12);
    // Generate random duration between 30 seconds and 10 minutes (600 seconds)
    const duration = 30 + Math.floor(Math.random() * 570);
    items.push({
      id: `vid-${id++}`,
      type: "video",
      name: names[nameIndex],
      description: descriptions[nameIndex],
      url: videoUrls[videoIndex],
      thumbnail: videoThumbnails[videoIndex],
      duration: duration,
    });
  }

  return items;
}

export const mediaItems: MediaItem[] = generateMediaItems();

export const ITEMS_PER_PAGE = 24;


