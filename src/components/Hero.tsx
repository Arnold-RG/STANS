const Hero = () => {
  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-6 animate-slide-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight">
            Smart Traffic-Aware
            <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Navigation System
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            An intelligent navigation system utilizing graph algorithms to compute optimal routes 
            considering real-time traffic conditions, blockades, and distance metrics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
