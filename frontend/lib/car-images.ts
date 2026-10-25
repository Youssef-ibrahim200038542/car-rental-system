
    const AVAILABLE_CAR_IMAGES = new Set([
    "bmw-3-series",
    "bmw-5-series",
    "bmw-m4",
    "bmw-x5",
    "chevrolet-equinox",
    "chevrolet-malibu",
    "chevrolet-spark",
    "chevrolet-tahoe",
    "ford-escape",
    "ford-explorer",
    "ford-focus",
    "ford-fusion",
    "honda-accord",
    "honda-civic",
    "honda-cr-v",
    "honda-fit",
    "honda-odyssey",
    "hyundai-accent",
    "hyundai-elantra",
    "hyundai-sonata",
    "hyundai-tucson",
    "jeep-grand-cherokee",
    "kia-carnival",
    "kia-cerato",
    "kia-forte",
    "kia-k5",
    "kia-rio",
    "kia-sportage",
    "mercedes-benz-c-class",
    "mercedes-benz-e-class",
    "mercedes-benz-glc",
    "mg-5",
    "mg-hs",
    "nissan-qashqai",
    "nissan-rogue",
    "nissan-sentra",
    "nissan-sunny",
    "nissan-versa",
    "skoda-octavia",
    "tesla-model-3",
    "tesla-model-y",
    "toyota-camry",
    "toyota-corolla",
    "toyota-rav4",
    "toyota-sienna",
    "toyota-yaris",
    "volkswagen-jetta",
    "volkswagen-passat",
    "volkswagen-tiguan",
    ]);

    const PLACEHOLDER_IMAGE = "/images/cars/car-placeholder.svg";

    function slugify(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    export function getLocalCarImage(
    brand?: string | null,
    model?: string | null,
    name?: string | null
    ): string {
    const candidates: string[] = [];

    if (brand?.trim() && model?.trim()) {
        const normalizedBrand = slugify(brand);
        const normalizedModel = slugify(model);

        candidates.push(`${normalizedBrand}-${normalizedModel}`);

        if (
        normalizedBrand === "mercedes" ||
        normalizedBrand === "mercedes-benz"
        ) {
        candidates.push(`mercedes-benz-${normalizedModel}`);
        }

        if (normalizedBrand === "vw") {
        candidates.push(`volkswagen-${normalizedModel}`);
        }
    }

    if (name?.trim()) {
        candidates.push(slugify(name));
    }

    if (model?.trim()) {
        const normalizedModel = slugify(model);
        candidates.push(normalizedModel);

        if (brand?.trim()) {
        const normalizedBrand = slugify(brand);

        if (normalizedModel.startsWith(`${normalizedBrand}-`)) {
            candidates.push(normalizedModel);
        }
        }
    }

    const matchedImage = candidates.find((candidate) =>
        AVAILABLE_CAR_IMAGES.has(candidate)
    );

    return matchedImage
        ? `/images/cars/${matchedImage}.jpg`
        : PLACEHOLDER_IMAGE;
    }

    export function getCarImageUrl(
    image?: string | null,
    brand?: string | null,
    model?: string | null,
    name?: string | null
    ): string {
    if (image?.trim()) {
        const value = image.trim();

        if (/^https?:\/\//i.test(value)) {
        return value;
        }

        const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

        const baseUrl = apiUrl.replace(/\/api\/?$/, "");
        const imagePath = value
        .replace(/^\/+/, "")
        .replace(/^public\//, "");

        if (imagePath.startsWith("images/")) {
        return `${baseUrl}/${imagePath}`;
        }

        const storagePath = imagePath.replace(/^storage\//, "");
        return `${baseUrl}/storage/${storagePath}`;
    }

    return getLocalCarImage(brand, model, name);
    }
