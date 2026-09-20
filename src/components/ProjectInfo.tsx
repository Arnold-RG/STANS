import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Target, Code } from "lucide-react";

const ProjectInfo = () => {
  const teamMembers = [
    { name: "Arnold Rurangwa", role: "Computer Engineer", id: "ARNOVA Group" },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
      <Card className="border-2 hover:border-primary/50 transition-colors duration-300">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="font-display">Project Scope</CardTitle>
          </div>
          <CardDescription>System Overview & Objectives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            The map guidance system helps individuals and businesses navigate efficiently, 
            positively impacting operations and daily lives. By calculating the fastest path 
            based on factors like blockades, traffic conditions, and distance, the system provides 
            users with optimal routes they wouldn't know about ahead of time.
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 hover:border-secondary/50 transition-colors duration-300">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Code className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="font-display">Technical Abstract</CardTitle>
          </div>
          <CardDescription>Algorithm & Implementation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            This system develops a map guidance platform utilizing <strong>Kruskal's algorithm</strong> to 
            compute the minimum spanning tree of a weighted directed graph. Graph weights are determined 
            by distance, traffic intensity, and blockades, integrated with Google Maps API for efficient 
            navigation considering both geographical and dynamic traffic conditions.
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 border-2 hover:border-accent/50 transition-colors duration-300">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="font-display">Author</CardTitle>
          </div>
          <CardDescription>ARNOVA Group · live traffic desk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-accent/5 hover:border-accent/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-primary">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {member.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 border-2 hover:border-primary/50 transition-colors duration-300">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="font-display">Product</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">System</h4>
            <ul className="space-y-2 text-foreground">
              <li><strong>Product:</strong> STANS live traffic desk</li>
              <li><strong>Focus:</strong> Routing, maps, and operations</li>
              <li><strong>Organization:</strong> ARNOVA Group</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Author</h4>
            <ul className="space-y-2 text-foreground">
              <li><strong>Engineer:</strong> Arnold Rurangwa</li>
              <li><strong>Title:</strong> Computer Engineer</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfo;
