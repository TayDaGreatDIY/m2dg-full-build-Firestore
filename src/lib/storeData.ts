
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
        amazonUrl: 'https://www.amazon.com/Wilson%C2%AE-Evolution%C2%AE-Indoor-Basketball-EA/dp/B0009KMXWY/ref=sr_1_1?crid=1GQMABW6OGPZM&dib=eyJ2IjoiMSJ9.c03zVigZxOaiHdK8f5OKWI3l8Dl_wx79N2YVE43b8nzynXFarGLevwY2B-cINVo-taT1XxaqTHCRoAi_3CUghuuZIfl2S7p66qB6hgtVSm_cFeYhikUxIIiKQj0g2zjgIitITTQzK6BLrkPdhb_Z1LgJzUyvCDpHWbbAxfUTKYG1UcgvZ25NYPpUPWmQit4cGpA2-Vlo8DGpzwsamIa2aAZWLka5zGRpJvJcUjyUWiw.m1jXlwisfE1UsdjNTTW0deOavGWcB3UbVYaQkx6Slu8&dib_tag=se&keywords=wilson%2Bevolution%2Bbasketball&qid=1761534079&s=audible&sprefix=wilson%2Bevolution%2Bbasketball%2Caudible%2C180&sr=1-1&th=1',
        price: '$79.95'
    },
    {
        id: 'sklz-dribble-stick',
        name: 'SKLZ Dribble Stick Basketball Trainer',
        description: 'Improve hand positioning, stance, and speed with the ball for better control and faster moves.',
        imageUrl: 'https://picsum.photos/seed/dribble-trainer/600/400',
        imageHint: 'basketball training',
        amazonUrl: 'https://www.amazon.com/SKLZ-Dribble-Adjustable-Basketball-Trainer/dp/B00EB6OGN6/ref=sr_1_1?crid=1VNA6CLYZCQ4H&dib=eyJ2IjoiMSJ9.vDrvPNxt3uCkcBiAOf90-EIulINpAaceclyyjJ4SINPqx38U7ndae7wtSzycmNO85rP-sF_DKA9y756SJPGvK3YLUoj89yTVqOCO89CIZWavJBEqp4kwySxohgoc73l8BlXMsQmEsUMB3A8cLZ3JQlbysWKew8H4CASximY_nUmexTBVgv6rR0F9jAokV_xqHHG5gPOH-3gcaGKX5d_buL9f56LRpeu5xEz7rBVzK9c.ED-6hFIeiDmCn4yW6pgG1MpRbWLz0BIxld2oQnAI9MM&dib_tag=se&keywords=SKLZ+Dribble+Stick+Basketball+Trainer&qid=1761534279&s=audible&sprefix=sklz+dribble+stick+basketball+trainer%2Caudible%2C1337&sr=1-1',
        price: '$29.99'
    },
    {
        id: 'the-shot-creator',
        name: 'Shot Tracker',
        description: 'Automatically tracks your shot attempts, makes, and misses, providing real-time feedback.',
        imageUrl: 'https://picsum.photos/seed/shot-tracker/600/400',
        imageHint: 'basketball tech',
        amazonUrl: 'https://www.amazon.com/dp/B073155M3B',
        price: '$149.99'
    },
    {
        id: 'pro-mini-hoop',
        name: 'SKLZ Pro Mini Hoop',
        description: 'Practice your shot anytime, anywhere. An indoor hoop with the look and function of a pro-grade basket.',
        imageUrl: 'https://picsum.photos/seed/mini-hoop/600/400',
        imageHint: 'mini basketball hoop',
        amazonUrl: 'https://www.amazon.com/dp/B001I1C52M',
        price: '$34.99'
    },
    {
        id: 'nike-elite-crew-socks',
        name: 'Nike Everyday Plus Cushioned Crew Socks',
        description: 'Featuring sweat-wicking technology and targeted cushioning for performance comfort on the court.',
        imageUrl: 'https://picsum.photos/seed/basketball-socks/600/400',
        imageHint: 'basketball socks',
        amazonUrl: 'https://www.amazon.com/dp/B083X2G9G4',
        price: '$22.00'
    },
    {
        id: 'agilty-ladder',
        name: 'Yes4All Agility Ladder',
        description: 'Improve your footwork, speed, and coordination. A must-have for serious athletes.',
        imageUrl: 'https://picsum.photos/seed/agility-ladder/600/400',
        imageHint: 'agility ladder',
        amazonUrl: 'https://www.amazon.com/dp/B073V2S16B',
        price: '$10.99'
    }
];
