import { Link } from "react-router-dom";
import { Tv, Shirt, Footprints, Home, Sparkles, Dumbbell } from "lucide-react";

interface CategoryIconsProps {
  onCategorySelect: (category: string) => void;
  selectedCategory: string;
}

const CategoryIcons = ({ onCategorySelect, selectedCategory }: CategoryIconsProps) => {
  const categories = [
    { icon: Tv, label: "Electronics", value: "electronics" },
    { icon: Shirt, label: "Fashion", value: "fashion" },
    { icon: Footprints, label: "Shoes", value: "shoes" },
    { icon: Home, label: "Home", value: "home" },
    { icon: Sparkles, label: "Beauty", value: "beauty" },
    { icon: Dumbbell, label: "Sports", value: "sports" },
  ];

  return (
    <section className="py-8 px-4 border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link
              key={category.value}
              to={`/category/${category.value}`}
              onClick={(e) => {
                e.preventDefault();
                onCategorySelect(selectedCategory === category.value ? "" : category.value);
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors ${
                selectedCategory === category.value 
                  ? "bg-black text-white" 
                  : "hover:bg-accent"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedCategory === category.value 
                  ? "bg-white text-black" 
                  : "bg-black text-white"
              }`}>
                <category.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-center">{category.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryIcons;
