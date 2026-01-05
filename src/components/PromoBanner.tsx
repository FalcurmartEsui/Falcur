import { Link } from "react-router-dom";

interface PromoBannerProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgColor?: string;
  textColor?: string;
  image?: string;
  discountText?: string;
}

const PromoBanner = ({ 
  title, 
  subtitle, 
  buttonText, 
  buttonLink,
  bgColor = "bg-muted",
  textColor = "text-foreground",
  image,
  discountText
}: PromoBannerProps) => {
  return (
    <div className={`${bgColor} ${textColor} py-6 md:py-12 px-4 md:px-8 relative overflow-hidden`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
          {/* Image Section - Store front style */}
          {image && (
            <div className="w-full md:w-1/2 flex-shrink-0">
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={title}
                  className="w-full h-56 md:h-72 object-cover"
                />
                {/* Sale text overlay like in the image */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="bg-black/80 text-white px-3 py-6 rounded">
                    <span className="text-lg font-bold writing-mode-vertical" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                      SALE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Content Section */}
          <div className={`w-full ${image ? 'md:w-1/2' : ''} text-center md:text-left z-10`}>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 italic">{title}</h3>
            <p className="text-xs md:text-sm opacity-70 mb-4 max-w-md mx-auto md:mx-0 leading-relaxed">
              {subtitle}
            </p>
            
            {discountText && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-1">Come and Enjoy Sale!</p>
                <p className="text-4xl md:text-5xl font-bold">{discountText}</p>
              </div>
            )}
            
            <Link 
              to={buttonLink}
              className="inline-flex items-center justify-center px-6 py-2 bg-foreground text-background rounded-sm text-xs font-medium hover:bg-foreground/90 transition-colors"
            >
              {buttonText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
