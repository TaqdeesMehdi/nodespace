import Image from "next/image";

export const HomeHeroSection = () => {
  return (
    <section className="container mx-auto px-6 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-12">
      <div className="flex-1 space-y-6 max-w-xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
          Automate your life with{" "}
          <span className="text-primary">NodeSpace</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Build powerful workflows with our intuitive drag-and-drop editor.
          Connect your favorite tools, automate repetitive tasks, and save hours
          of manual work every single day. Look no further!
        </p>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        <Image
          src="/home-hero-section.jpg"
          alt="NodeSpace Editor"
          width={700}
          height={500}
          className="
      w-full h-auto
      object-contain
      opacity-90
      [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent),
                   linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]
      mask-intersect
    "
        />
      </div>
    </section>
  );
};
