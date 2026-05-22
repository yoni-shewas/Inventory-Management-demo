import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
let apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

const parseEnvValue = (key: string, current: string | undefined): string | undefined => {
  if (current && !current.startsWith("your_")) {
    return current;
  }
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const regex = new RegExp(`^${key}=["']?(.*?)["']?$`, "m");
      const match = envContent.match(regex);
      if (match && match[1] && !match[1].startsWith("your_")) {
        return match[1];
      }
    }
  } catch (e) {
    // Ignore
  }
  return current;
};

cloudName = parseEnvValue("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", cloudName);
apiKey = parseEnvValue("CLOUDINARY_API_KEY", apiKey);
apiSecret = parseEnvValue("CLOUDINARY_API_SECRET", apiSecret);

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;