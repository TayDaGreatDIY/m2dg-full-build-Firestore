
export type Product = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    imageHint: string;
    amazonUrl: string;
    price: string;
};

export const storeProducts: Product[] = [
    {
        id: 'wilson-evo-nxt',
        name: 'Wilson Evolution Game Basketball',
        description: 'The #1 indoor game ball in America. The standard for performance and innovation.',
        imageUrl: 'https://picsum.photos/seed/basketball/600/400',
        imageHint: 'basketball product',
        amazonUrl: 'https://www.amazon.com/dp/B085F4ZJ6B', // Example link
        price: '$79.95'
    },
    {
        id: 'sklz-dribble-stick',
        name: 'SKLZ Dribble Stick',
        description: 'Improve hand positioning, stance, and speed with the ball for better control and faster moves.',
        imageUrl: 'https://picsum.photos/seed/dribble-trainer/600/400',
        imageHint: 'basketball training',
        amazonUrl: '#',
        price: '$69.99'
    },
    {
        id: 'the-shot-creator',
        name: 'The Shot Creator by ShotTracker',
        description: 'Automatically tracks your shot attempts, makes, and misses, providing real-time feedback.',
        imageUrl: 'https://picsum.photos/seed/shot-tracker/600/400',
        imageHint: 'basketball tech',
        amazonUrl: '#',
        price: '$149.99'
    },
    {
        id: 'pro-mini-hoop',
        name: 'SKLZ Pro Mini Hoop',
        description: 'Practice your shot anytime, anywhere. An indoor hoop with the look and function of a pro-grade basket.',
        imageUrl: 'https://picsum.photos/seed/mini-hoop/600/400',
        imageHint: 'mini basketball hoop',
        amazonUrl: '#',
        price: '$34.99'
    },
    {
        id: 'nike-elite-crew-socks',
        name: 'Nike Elite Crew Basketball Socks',
        description: 'Featuring sweat-wicking technology and targeted cushioning for performance comfort on the court.',
        imageUrl: 'https://picsum.photos/seed/basketball-socks/600/400',
        imageHint: 'basketball socks',
        amazonUrl: '#',
        price: '$18.00'
    },
    {
        id: 'agilty-ladder',
        name: 'Agility Ladder',
        description: 'Improve your footwork, speed, and coordination. A must-have for serious athletes.',
        imageUrl: 'https://picsum.photos/seed/agility-ladder/600/400',
        imageHint: 'agility ladder',
        amazonUrl: '#',
        price: '$15.99'
    }
];
