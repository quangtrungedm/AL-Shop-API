require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product.model');
const Category = require('./models/Category.model');

// --- DỮ LIỆU SẢN PHẨM KHỔNG LỒ (48 Món) ---
const rawProducts = [
    // 1. Men's Tops
    {
        name: "Classic Oxford Button-Down Shirt",
        categoryName: "Men's Tops",
        description: "A timeless classic tailored from premium breathable cotton. Features a button-down collar and a relaxed fit perfect for both office and casual wear.",
        price: 45,
        stock: 100,
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Vintage Graphic T-Shirt",
        categoryName: "Men's Tops",
        description: "Retro-inspired graphic tee made from soft, pre-shrunk cotton jersey. Features a vintage wash finish for that lived-in look and feel.",
        price: 28,
        stock: 50,
        image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Slim-Fit Polo Shirt",
        categoryName: "Men's Tops",
        description: "Sporty yet sophisticated. This slim-fit polo is crafted from pique cotton mesh for superior breathability and features ribbed cuffs.",
        price: 35,
        stock: 75,
        image: "https://images.unsplash.com/photo-1626557981101-aae6f84aa6ff?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Heavyweight Flannel Overshirt",
        categoryName: "Men's Tops",
        description: "Rugged and warm, this heavyweight flannel overshirt works as a standalone piece or a layering staple. Brushed fabric for extra softness.",
        price: 55,
        stock: 40,
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
    },

    // 2. Men's Bottoms
    {
        name: "Straight-Leg Selvedge Jeans",
        categoryName: "Men's Bottoms",
        description: "Premium Japanese selvedge denim in a classic straight-leg cut. Rigid denim that breaks in beautifully over time.",
        price: 120,
        stock: 60,
        image: "https://images.unsplash.com/photo-1542272454324-414fb581f1b7?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Slim Chino Trousers",
        categoryName: "Men's Bottoms",
        description: "Versatile slim-fit chinos made from stretch cotton twill. Essential for a smart-casual wardrobe, available in khaki and navy.",
        price: 48,
        stock: 80,
        image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Cargo Joggers",
        categoryName: "Men's Bottoms",
        description: "Utility meets comfort. These joggers feature multiple cargo pockets and an elastic waistband with drawstrings for the perfect fit.",
        price: 52,
        stock: 45,
        image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Tailored Dress Pants",
        categoryName: "Men's Bottoms",
        description: "Sharp and sophisticated dress pants made from a wool-blend fabric. Anti-wrinkle technology ensures you look crisp all day.",
        price: 85,
        stock: 30,
        image: "https://images.unsplash.com/photo-1594938328870-9623159c8c99?auto=format&fit=crop&w=800&q=80"
    },

    // 3. Women's Tops
    {
        name: "Silk Satin Blouse",
        categoryName: "Women's Tops",
        description: "Luxurious silk satin blouse with a drape neck design. Adds an elegant touch to any outfit, perfect for evening wear or office chic.",
        price: 65,
        stock: 40,
        image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Oversized Knit Sweater",
        categoryName: "Women's Tops",
        description: "Cozy oversized sweater made from a soft wool blend. Chunky knit texture keeps you warm and stylish during colder months.",
        price: 58,
        stock: 55,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Basic Ribbed Crop Top",
        categoryName: "Women's Tops",
        description: "Essential ribbed crop top with a high neck. Stretchy and comfortable, ideal for layering or wearing with high-waisted bottoms.",
        price: 22,
        stock: 120,
        image: "https://images.unsplash.com/photo-1521577306547-80f75ca67eb4?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Floral Print Peplum Top",
        categoryName: "Women's Tops",
        description: "Feminine peplum top with a delicate floral print. Features puffed sleeves and a cinched waist for a flattering silhouette.",
        price: 42,
        stock: 35,
        image: "https://images.unsplash.com/photo-1551163943-3f6a29e3945a?auto=format&fit=crop&w=800&q=80"
    },

    // 4. Women's Bottoms
    {
        name: "High-Waisted Mom Jeans",
        categoryName: "Women's Bottoms",
        description: "Vintage-inspired mom jeans with a high waist and tapered leg. Made from durable non-stretch denim for an authentic look.",
        price: 55,
        stock: 70,
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Pleated Midi Skirt",
        categoryName: "Women's Bottoms",
        description: "Elegant pleated midi skirt that moves beautifully with every step. Metallic finish adds a touch of glamour to your wardrobe.",
        price: 48,
        stock: 40,
        image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Wide-Leg Linen Trousers",
        categoryName: "Women's Bottoms",
        description: "Breathable linen trousers with a wide-leg silhouette. Perfect for summer days, offering both comfort and effortless style.",
        price: 62,
        stock: 30,
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Denim A-Line Shorts",
        categoryName: "Women's Bottoms",
        description: "Classic A-line denim shorts with a raw hem. High-rise fit accentuates the waist, a summer staple.",
        price: 32,
        stock: 85,
        image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80"
    },

    // 5. Dresses
    {
        name: "Floral Wrap Dress",
        categoryName: "Dresses",
        description: "Romantic wrap dress with ruffle details and a vibrant floral print. Adjustable waist tie ensures a custom fit for all body types.",
        price: 58,
        stock: 45,
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Little Black Cocktail Dress",
        categoryName: "Dresses",
        description: "The iconic LBD. Sleek, form-fitting silhouette with a modern square neckline. Perfect for parties and formal events.",
        price: 75,
        stock: 30,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Bohemian Maxi Dress",
        categoryName: "Dresses",
        description: "Free-spirited boho maxi dress with bell sleeves and intricate embroidery. Made from lightweight cotton for breezy comfort.",
        price: 68,
        stock: 25,
        image: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Office Shirt Dress",
        categoryName: "Dresses",
        description: "Smart and professional shirt dress with a waist belt. Crisp cotton blend fabric that holds its shape throughout the workday.",
        price: 52,
        stock: 40,
        image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=800&q=80"
    },

    // 6. Outerwear
    {
        name: "Classic Beige Trench Coat",
        categoryName: "Outerwear",
        description: "Timeless double-breasted trench coat. Water-resistant fabric with a removable belt, an essential layer for transitional weather.",
        price: 120,
        stock: 20,
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Leather Biker Jacket",
        categoryName: "Outerwear",
        description: "Edgy faux leather moto jacket with silver hardware zips. Adds instant attitude to any outfit, lined for warmth.",
        price: 85,
        stock: 35,
        image: "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Puffer Jacket",
        categoryName: "Outerwear",
        description: "Lightweight yet incredibly warm down puffer jacket. Packable design makes it great for travel and cold commutes.",
        price: 95,
        stock: 40,
        image: "https://images.unsplash.com/photo-1545593169-5297d6e60742?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Denim Sherpa Jacket",
        categoryName: "Outerwear",
        description: "Classic denim trucker jacket lined with cozy sherpa fleece. Vintage wash gives it a cool, retro vibe.",
        price: 70,
        stock: 50,
        image: "https://images.unsplash.com/photo-1516257984-b1b4d8c9230c?auto=format&fit=crop&w=800&q=80"
    },

    // 7. Activewear
    {
        name: "Performance Compression Leggings",
        categoryName: "Activewear",
        description: "High-waisted compression leggings for intense workouts. Sweat-wicking fabric keeps you dry and supported.",
        price: 45,
        stock: 80,
        image: "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Seamless Sports Bra",
        categoryName: "Activewear",
        description: "Medium-impact seamless sports bra with removable pads. Racerback design allows for full range of motion.",
        price: 30,
        stock: 100,
        image: "https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Men's Training Shorts",
        categoryName: "Activewear",
        description: "Lightweight gym shorts with built-in liner. Quick-dry technology and side vents for maximum breathability.",
        price: 28,
        stock: 60,
        image: "https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Breathable Running Tee",
        categoryName: "Activewear",
        description: "Ultra-light running t-shirt with reflective details for night safety. Anti-odor fabric technology.",
        price: 25,
        stock: 70,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"
    },

    // 8. Lingerie & Sleepwear
    {
        name: "Silk Satin Pajama Set",
        categoryName: "Lingerie & Sleepwear",
        description: "Elegant 2-piece pajama set in silky smooth satin. Contrast piping details and relaxed fit for a luxurious night's sleep.",
        price: 55,
        stock: 30,
        image: "https://images.unsplash.com/photo-1582716401301-b2407dc7563d?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Lace Bralette",
        categoryName: "Lingerie & Sleepwear",
        description: "Delicate floral lace bralette with no underwire for ultimate comfort. Adjustable straps and hook-and-eye closure.",
        price: 24,
        stock: 60,
        image: "https://images.unsplash.com/photo-1616248272161-49b49b3927d3?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Cotton Bathrobe",
        categoryName: "Lingerie & Sleepwear",
        description: "Plush cotton waffle-weave bathrobe. Spa-quality comfort at home, featuring deep pockets and a waist tie.",
        price: 45,
        stock: 25,
        image: "https://images.unsplash.com/photo-1551233075-4720937b420f?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Cozy Lounge Set",
        categoryName: "Lingerie & Sleepwear",
        description: "Soft knit lounge set with joggers and a matching pullover. Perfect for lazy weekends at home.",
        price: 48,
        stock: 40,
        image: "https://images.unsplash.com/photo-1605763240004-7e93b172d754?auto=format&fit=crop&w=800&q=80"
    },

    // 9. Footwear
    {
        name: "White Leather Sneakers",
        categoryName: "Footwear",
        description: "Minimalist white leather sneakers. Versatile design that pairs with everything from jeans to suits. Durable rubber sole.",
        price: 89,
        stock: 50,
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Suede Chelsea Boots",
        categoryName: "Footwear",
        description: "Classic tan suede Chelsea boots with elastic side panels. Sleek silhouette for a refined look.",
        price: 110,
        stock: 30,
        image: "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Running Performance Shoes",
        categoryName: "Footwear",
        description: "High-performance running shoes with cushioned foam technology. Lightweight mesh upper for breathability.",
        price: 120,
        stock: 45,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Strappy Summer Sandals",
        categoryName: "Footwear",
        description: "Chic leather sandals with adjustable straps. Comfortable flat sole perfect for beach days or city walks.",
        price: 40,
        stock: 60,
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80"
    },

    // 10. Bags
    {
        name: "Canvas Tote Bag",
        categoryName: "Bags",
        description: "Durable canvas tote with reinforced handles. Spacious enough for a laptop, groceries, or gym gear.",
        price: 25,
        stock: 100,
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Leather Crossbody Bag",
        categoryName: "Bags",
        description: "Compact leather crossbody bag with gold hardware. Features multiple compartments to keep essentials organized.",
        price: 75,
        stock: 40,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Travel Backpack",
        categoryName: "Bags",
        description: "Water-resistant travel backpack with a padded laptop sleeve and USB charging port. Ergonomic shoulder straps.",
        price: 65,
        stock: 50,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Structured Handbag",
        categoryName: "Bags",
        description: "Elegant structured handbag suitable for the office. Comes with a detachable shoulder strap for versatility.",
        price: 95,
        stock: 25,
        image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80"
    },

    // 11. Accessories
    {
        name: "Minimalist Gold Watch",
        categoryName: "Accessories",
        description: "Sleek analog watch with a gold mesh strap. Water-resistant up to 30m, perfect for everyday elegance.",
        price: 120,
        stock: 20,
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Aviator Sunglasses",
        categoryName: "Accessories",
        description: "Classic aviator sunglasses with UV400 protection. Metal frame with polarized lenses to reduce glare.",
        price: 35,
        stock: 80,
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Leather Belt",
        categoryName: "Accessories",
        description: "Genuine leather belt with a brushed metal buckle. Available in black and brown to match any trousers.",
        price: 30,
        stock: 60,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Wool Beanie",
        categoryName: "Accessories",
        description: "Soft knit wool beanie to keep you warm. Ribbed cuff design ensures a snug and comfortable fit.",
        price: 18,
        stock: 100,
        image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80"
    },

    // 12. Kids' Fashion
    {
        name: "Kids' Graphic Tee",
        categoryName: "Kids' Fashion",
        description: "Fun and colorful graphic t-shirt for kids. Made from 100% organic cotton, gentle on sensitive skin.",
        price: 15,
        stock: 80,
        image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Kids' Denim Overalls",
        categoryName: "Kids' Fashion",
        description: "Durable denim overalls with adjustable straps. Plenty of pockets for storing treasures found on adventures.",
        price: 35,
        stock: 40,
        image: "https://images.unsplash.com/photo-1519238263496-63f82a0d2880?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Kids' Sneaker Shoes",
        categoryName: "Kids' Fashion",
        description: "Velcro strap sneakers for easy on and off. Cushioned sole supports growing feet during playtime.",
        price: 40,
        stock: 50,
        image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "Kids' Puffer Jacket",
        categoryName: "Kids' Fashion",
        description: "Warm and colorful puffer jacket with a hood. Water-resistant shell keeps kids dry on rainy days.",
        price: 45,
        stock: 35,
        image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80"
    }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--> ✅ Connected to MongoDB for Product Seeding');

        // 1. Fetch Categories for Mapping
        const categories = await Category.find();
        if (categories.length === 0) {
            console.log('❌ Error: Categories not found. Please run seed-categories.js first!');
            process.exit();
        }

        const categoryMap = {};
        categories.forEach(cat => {
            // Map both English names (if you switched) or map by loosely matching
            categoryMap[cat.name] = cat._id;
        });

        // 2. Clear Old Products
        await Product.deleteMany({});
        console.log('--> 🗑️ Cleared old products');

        // 3. Prepare Data
        const productsToSave = [];

        for (const p of rawProducts) {
            // Thử tìm category theo tên trong rawProducts
            // Nếu bạn dùng tên tiếng Việt trong DB thì cần đảm bảo tên trong rawProducts khớp
            // Hoặc bạn có thể dùng logic tìm kiếm thông minh hơn nếu cần
            const catId = categoryMap[p.categoryName];
            
            if (catId) {
                productsToSave.push({
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    category: catId,
                    stock: p.stock,
                    image: [p.image], 
                    isActive: true
                });
            } else {
                // Fallback: Nếu không khớp tên (do khác ngôn ngữ), hãy thử tìm tương đối hoặc báo lỗi
                // Ví dụ: Map "Men's Tops" -> "Áo Nam" nếu cần thiết
                console.warn(`⚠️ Warning: Category "${p.categoryName}" not found. Skipped product "${p.name}".`);
                console.log(`   (Available categories: ${Object.keys(categoryMap).join(', ')})`);
            }
        }

        // 4. Save
        if (productsToSave.length > 0) {
            await Product.insertMany(productsToSave);
            console.log(`--> 🎉 Successfully added ${productsToSave.length} products!`);
        } else {
            console.log('--> No products were added. Check category names matching.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

seedProducts();