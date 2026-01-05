const MarqueeBar = () => {
  return (
    <div className="bg-black text-white py-2 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap">
        <span className="mx-4">Welcome to falcur mart</span>
        <span className="mx-4">Welcome to falcur mart</span>
        <span className="mx-4">Welcome to falcur mart</span>
        <span className="mx-4">Welcome to falcur mart</span>
      </div>
    </div>
  );
};

export default MarqueeBar;
