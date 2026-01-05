import { CreditCard, Repeat, ThumbsUp, Package } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: CreditCard,
      title: "Secure payment",
      desc: "Secure online payment"
    },
    {
      icon: Repeat,
      title: "7-14 days returns",
      desc: "Money back guaranteed"
    },
    {
      icon: ThumbsUp,
      title: "Customer support",
      desc: "Available 24/7"
    },
    {
      icon: Package,
      title: "Free delivery",
      desc: "On all products over ₦ 100,000"
    }
  ];

  return (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <div key={idx} className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
              <feature.icon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
