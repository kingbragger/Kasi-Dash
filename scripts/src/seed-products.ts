import { db, productsTable } from "@workspace/db";

const products = [
  {
    title: "Apple iPhone 11 - Unlocked (Very Good Condition)",
    description: "Apple iPhone 11 with A13 Bionic chip, dual rear cameras, 4K video recording, and Face ID. Network unlocked. Available in 64GB, 128GB and 256GB across six colours. Very good refurbished condition.",
    price: "2802.29",
    compareAtPrice: null as string | null,
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/apple-iphone-11-64gb-128gb-256_0.jpg?v=1782681123",
    category: "Smartphones",
    sku: null as string | null,
  },
  {
    title: "Apple iPhone 13 Mini - HK Version, Unlocked (Grade A)",
    description: "Apple iPhone 13 Mini (HK Version), unlocked, Grade A excellent condition. Available in 128GB and 256GB across six colours.",
    price: "5908.40",
    compareAtPrice: null,
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/apple-iphone-13-mini-128gb-256_0.jpg?v=1782681153",
    category: "Smartphones",
    sku: null,
  },
  {
    title: "Dell Latitude 3390 2-in-1 Touchscreen Laptop - i5, 8GB, 128GB SSD, Win 11 Pro",
    description: "Dell Latitude 3390 2-in-1 convertible laptop. Intel i5, 8GB RAM, 128GB SSD, touchscreen, Windows 11 Pro. Compact, business-grade machine.",
    price: "3019.70",
    compareAtPrice: null,
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/dell-latitude-3390-2-in-1-i5-8_0.jpg?v=1782681174",
    category: "Laptops",
    sku: "DELL-LAT3390-i5",
  },
  {
    title: "Dell Mini Desktop PC - i5 6th Gen, 16GB RAM, 256GB SSD, Windows 11",
    description: "Dell Mini Desktop PC. Intel i5 6th gen, 16GB RAM, 256GB SSD, Windows 11, WiFi and Bluetooth. Compact workstation for home or office.",
    price: "4427.18",
    compareAtPrice: null,
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/dell-mini-desktop-pc-computer-_0.jpg?v=1782681436",
    category: "Desktops",
    sku: "DELL-MINI-i5-16-256",
  },
  {
    title: "Sony PlayStation 4 Pro Console - Glacier White 1TB (Japan HDMI)",
    description: "Sony PlayStation 4 Pro Game Home Console, Glacier White, 1TB HDD. Japan HDMI 2018 model. Excellent condition.",
    price: "3990.88",
    compareAtPrice: null,
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/sony-playstation-r-4-pro-game-_0.jpg?v=1782681091",
    category: "Gaming Consoles",
    sku: "PS4PRO-1TB-WHT",
  },
  {
    title: "Dell Mini Desktop PC Computer i5 6TH, 16GB RAM 256GB SSD, Windows 11, WiFi BT",
    description: "Intel Core i5 6th Gen Mini Desktop. 16GB RAM, 256GB SSD, Windows 11, HDMI, USB 3.0, DisplayPort, WiFi, Bluetooth.",
    price: "4427.18",
    compareAtPrice: "4427.18",
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/s-l1600_5c121e3e-4a4d-417e-bad6-c8c6614a3d25.jpg?v=1782675343",
    category: "Desktops",
    sku: null,
  },
  {
    title: "Sony PlayStation R 4 Pro 1TB Glacier White (Japan 2018)",
    description: "Sony PlayStation 4 Pro, 1TB HDD, Glacier White. Japan CUH-7200BB02 model. 4K UHD, HDR, Wi-Fi. Region free.",
    price: "3990.88",
    compareAtPrice: "3990.88",
    status: "active" as const,
    inventory: 9,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/s-l1600_f23b40df-1ca1-40d7-a867-567a68fe880f.jpg?v=1782675255",
    category: "Gaming Consoles",
    sku: null,
  },
  {
    title: "Apple iPhone 11 64GB/128GB/256GB - All Colours - Unlocked (Very Good)",
    description: "Apple iPhone 11 unlocked, all storage and colour options. A13 Bionic, 4K video, Face ID. Screen and battery may include OEM parts. Very good condition.",
    price: "2802.29",
    compareAtPrice: "2802.29",
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/s-l1600.jpg?v=1782675102",
    category: "Smartphones",
    sku: null,
  },
  {
    title: "Apple iPhone 13 Mini 128GB/256GB HK Version - Grade A",
    description: "iPhone 13 Mini HK Version (Model A2628). 5G, all colours, Grade A condition. Professionally inspected, fully unlocked.",
    price: "5908.40",
    compareAtPrice: "5908.40",
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/s-l1600_860a6443-2ed1-4e97-abe7-e81c00d622c6.jpg?v=1782675679",
    category: "Smartphones",
    sku: null,
  },
  {
    title: "Dell Latitude 3390 2-in-1 i5 8GB RAM 128GB SSD TOUCHSCREEN Win 11 Pro",
    description: "Dell Latitude 3390 2-in-1. Intel Core i5-8350U, 8GB RAM, 128GB SSD, 13.3\" FHD touchscreen, Windows 11 Pro. Ideal for business and casual computing.",
    price: "3019.70",
    compareAtPrice: "3019.70",
    status: "active" as const,
    inventory: 10,
    imageUrl: "https://cdn.shopify.com/s/files/1/0781/6963/7052/files/s-l1600_d4b5784d-f1d9-4aa3-b236-0989bda09b9e.jpg?v=1782675603",
    category: "Laptops",
    sku: null,
  },
];

async function seed() {
  console.log(`Seeding ${products.length} products…`);
  for (const product of products) {
    await db.insert(productsTable).values(product).onConflictDoNothing();
  }
  console.log("Done!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
