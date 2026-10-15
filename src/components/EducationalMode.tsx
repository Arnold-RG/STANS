import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle2, XCircle, ChevronRight, Trophy, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface Tutorial {
  id: string;
  title: string;
  algorithm: 'kruskal' | 'prim' | 'dijkstra';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: TutorialStep[];
  quiz: Quiz;
}

interface TutorialStep {
  title: string;
  content: string;
  visualHint?: string;
  code?: string;
}

interface Quiz {
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const EducationalMode: React.FC = () => {
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

  const tutorials: Tutorial[] = [
    {
      id: 'kruskal-basics',
      title: "Kruskal's Algorithm Fundamentals",
      algorithm: 'kruskal',
      difficulty: 'beginner',
      steps: [
        {
          title: 'Introduction to Minimum Spanning Trees',
          content: "A Minimum Spanning Tree (MST) is a subset of edges that connects all vertices in a weighted graph with the minimum total edge weight, without forming any cycles. Kruskal's algorithm finds the MST by sorting edges and selecting them greedily.",
          visualHint: 'Imagine connecting cities with the least amount of road.',
        },
        {
          title: 'The Greedy Approach',
          content: "Kruskal's algorithm uses a greedy strategy: always pick the smallest available edge that doesn't create a cycle. This local optimum leads to a global optimum for MST problems.",
          code: `// Sort edges by weight
edges.sort((a, b) => a.weight - b.weight);

// Pick smallest edges that don't form cycles
for (edge of edges) {
  if (!formsCycle(edge)) {
    mst.add(edge);
  }
}`,
        },
        {
          title: 'Union-Find Data Structure',
          content: 'To efficiently detect cycles, we use the Union-Find (Disjoint Set Union) data structure. It tracks which vertices belong to the same connected component.',
          code: `class UnionFind {
  find(x) {
    // Find root with path compression
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  }
  
  union(x, y) {
    // Merge sets by rank
    rootX = find(x);
    rootY = find(y);
    if (rank[rootX] < rank[rootY]) {
      parent[rootX] = rootY;
    } else {
      parent[rootY] = rootX;
    }
  }
}`,
        },
        {
          title: 'Algorithm Complexity',
          content: "Time Complexity: O(E log E) for sorting edges, plus O(E α(V)) for union-find operations, where α is the inverse Ackermann function (practically constant). Space Complexity: O(V) for the union-find structure.",
          visualHint: 'Sorting dominates the runtime!',
        },
      ],
      quiz: {
        questions: [
          {
            id: 'q1',
            question: "What is the main strategy used by Kruskal's algorithm?",
            options: [
              'Always pick the edge with maximum weight',
              'Pick the smallest edge that does not form a cycle',
              'Start from a random vertex and grow the tree',
              'Use dynamic programming to find all paths',
            ],
            correctAnswer: 1,
            explanation: "Kruskal's algorithm uses a greedy approach by always selecting the smallest available edge that doesn't create a cycle.",
          },
          {
            id: 'q2',
            question: 'What data structure is used to efficiently detect cycles?',
            options: [
              'Binary Search Tree',
              'Hash Table',
              'Union-Find (Disjoint Set)',
              'Priority Queue',
            ],
            correctAnswer: 2,
            explanation: 'Union-Find efficiently tracks connected components and detects cycles in nearly constant time.',
          },
          {
            id: 'q3',
            question: "What is the time complexity of Kruskal's algorithm?",
            options: [
              'O(V²)',
              'O(E log E)',
              'O(V log V)',
              'O(E + V)',
            ],
            correctAnswer: 1,
            explanation: 'The dominant factor is sorting edges, which takes O(E log E) time.',
          },
        ],
      },
    },
    {
      id: 'prim-basics',
      title: "Prim's Algorithm Fundamentals",
      algorithm: 'prim',
      difficulty: 'beginner',
      steps: [
        {
          title: 'Introduction to Prim\'s Algorithm',
          content: "Prim's algorithm builds a minimum spanning tree by starting from a single vertex and growing the tree one edge at a time, always adding the smallest edge that connects a vertex in the tree to a vertex outside the tree.",
          visualHint: 'Think of it as growing a tree from a seed.',
        },
        {
          title: 'The Growing Tree Approach',
          content: "Unlike Kruskal's which considers all edges globally, Prim's grows the MST from a starting vertex. At each step, add the minimum-weight edge that expands the tree.",
          code: `// Start from any vertex
visited.add(startVertex);

while (visited.size < numVertices) {
  // Find minimum edge from visited to unvisited
  minEdge = findMinEdge(visited, unvisited);
  mst.add(minEdge);
  visited.add(minEdge.to);
}`,
        },
        {
          title: 'Priority Queue Optimization',
          content: 'Using a min-heap (priority queue) makes finding the next minimum edge efficient. We can achieve O((E + V) log V) time complexity with this optimization.',
          code: `pq = new PriorityQueue(); // min-heap
pq.add({vertex: start, weight: 0});

while (!pq.isEmpty()) {
  current = pq.poll();
  if (visited[current.vertex]) continue;
  
  visited[current.vertex] = true;
  for (neighbor of current.neighbors) {
    if (!visited[neighbor]) {
      pq.add({vertex: neighbor, weight: edgeWeight});
    }
  }
}`,
        },
      ],
      quiz: {
        questions: [
          {
            id: 'p1',
            question: "How does Prim's algorithm grow the MST?",
            options: [
              'By sorting all edges first',
              'By starting from any vertex and growing one edge at a time',
              'By using dynamic programming',
              'By finding all paths simultaneously',
            ],
            correctAnswer: 1,
            explanation: "Prim's algorithm starts from a single vertex and incrementally adds the smallest edge that connects to an unvisited vertex.",
          },
          {
            id: 'p2',
            question: 'What data structure optimizes Prim\'s algorithm?',
            options: [
              'Stack',
              'Queue',
              'Priority Queue (Min-Heap)',
              'Linked List',
            ],
            correctAnswer: 2,
            explanation: 'A priority queue efficiently retrieves the minimum-weight edge at each step.',
          },
        ],
      },
    },
    {
      id: 'dijkstra-basics',
      title: "Dijkstra's Algorithm Fundamentals",
      algorithm: 'dijkstra',
      difficulty: 'intermediate',
      steps: [
        {
          title: 'Introduction to Shortest Path',
          content: "Dijkstra's algorithm finds the shortest path from a source vertex to all other vertices in a weighted graph with non-negative edge weights. It's essential for navigation and routing applications.",
          visualHint: 'Like finding the fastest route on a map.',
        },
        {
          title: 'The Relaxation Process',
          content: 'Dijkstra repeatedly "relaxes" edges: if we find a shorter path to a vertex through another vertex, we update the distance. This process continues until all vertices are visited.',
          code: `distances[start] = 0;
pq.add({vertex: start, dist: 0});

while (!pq.isEmpty()) {
  current = pq.poll();
  
  for (neighbor of current.neighbors) {
    newDist = distances[current] + weight(current, neighbor);
    if (newDist < distances[neighbor]) {
      distances[neighbor] = newDist; // Relaxation
      pq.add({vertex: neighbor, dist: newDist});
    }
  }
}`,
        },
      ],
      quiz: {
        questions: [
          {
            id: 'd1',
            question: "What does Dijkstra's algorithm find?",
            options: [
              'Minimum spanning tree',
              'Shortest path from source to all vertices',
              'Maximum flow',
              'All cycles in a graph',
            ],
            correctAnswer: 1,
            explanation: "Dijkstra's algorithm computes the shortest path from a single source to all other vertices.",
          },
        ],
      },
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'intermediate': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'advanced': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm) {
      case 'kruskal': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'prim': return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'dijkstra': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const handleStartTutorial = (tutorialId: string) => {
    setActiveTutorial(tutorialId);
    setCurrentStep(0);
    setQuizAnswers({});
    setShowResults(false);
  };

  const handleNextStep = () => {
    const tutorial = tutorials.find(t => t.id === activeTutorial);
    if (!tutorial) return;

    if (currentStep < tutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Move to quiz
      setCurrentStep(tutorial.steps.length);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers({ ...quizAnswers, [questionId]: answerIndex });
  };

  const handleSubmitQuiz = () => {
    const tutorial = tutorials.find(t => t.id === activeTutorial);
    if (!tutorial) return;

    const correctAnswers = tutorial.quiz.questions.filter(
      q => quizAnswers[q.id] === q.correctAnswer
    ).length;

    setShowResults(true);

    if (correctAnswers === tutorial.quiz.questions.length) {
      if (!completedTutorials.includes(tutorial.id)) {
        setCompletedTutorials([...completedTutorials, tutorial.id]);
      }
      toast.success('Perfect score! Tutorial completed! 🎉');
    } else {
      toast.info(`You got ${correctAnswers}/${tutorial.quiz.questions.length} correct. Review the explanations!`);
    }
  };

  const activeTutorialData = tutorials.find(t => t.id === activeTutorial);
  const progress = activeTutorialData 
    ? ((currentStep + 1) / (activeTutorialData.steps.length + 1)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Educational Mode
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Learn graph algorithms through interactive tutorials and quizzes
          </p>
        </div>
        {completedTutorials.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span>{completedTutorials.length}/{tutorials.length} Completed</span>
          </div>
        )}
      </div>

      {!activeTutorial ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutorials.map((tutorial) => (
            <Card
              key={tutorial.id}
              className="p-6 border-traffic-medium/20 bg-background/50 backdrop-blur hover:border-primary/50 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <BookOpen className="h-8 w-8 text-primary" />
                  {completedTutorials.includes(tutorial.id) && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{tutorial.title}</h3>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline" className={getAlgorithmColor(tutorial.algorithm)}>
                      {tutorial.algorithm.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getDifficultyColor(tutorial.difficulty)}>
                      {tutorial.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• {tutorial.steps.length} interactive steps</p>
                  <p>• {tutorial.quiz.questions.length} quiz questions</p>
                  <p>• Practical examples & code</p>
                </div>

                <Button
                  onClick={() => handleStartTutorial(tutorial.id)}
                  className="w-full"
                  variant={completedTutorials.includes(tutorial.id) ? 'outline' : 'default'}
                >
                  {completedTutorials.includes(tutorial.id) ? 'Review' : 'Start Tutorial'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 border-traffic-medium/20 bg-background/50 backdrop-blur">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{activeTutorialData?.title}</h3>
              <Button onClick={() => setActiveTutorial(null)} variant="ghost" size="sm">
                Exit Tutorial
              </Button>
            </div>

            <Progress value={progress} className="h-2" />

            {currentStep < (activeTutorialData?.steps.length || 0) ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    Step {currentStep + 1}: {activeTutorialData?.steps[currentStep].title}
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    {activeTutorialData?.steps[currentStep].content}
                  </p>

                  {activeTutorialData?.steps[currentStep].visualHint && (
                    <Card className="p-4 bg-primary/5 border-primary/20 mb-4">
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{activeTutorialData.steps[currentStep].visualHint}</p>
                      </div>
                    </Card>
                  )}

                  {activeTutorialData?.steps[currentStep].code && (
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{activeTutorialData.steps[currentStep].code}</code>
                    </pre>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={handlePreviousStep}
                    disabled={currentStep === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button onClick={handleNextStep}>
                    {currentStep === (activeTutorialData?.steps.length || 0) - 1 ? 'Take Quiz' : 'Next Step'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Quiz Time! Test Your Knowledge</h4>

                {activeTutorialData?.quiz.questions.map((question, qIndex) => (
                  <Card key={question.id} className="p-4 border-traffic-medium/20">
                    <div className="space-y-4">
                      <p className="font-semibold">
                        {qIndex + 1}. {question.question}
                      </p>

                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <label
                            key={oIndex}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              quizAnswers[question.id] === oIndex
                                ? 'border-primary bg-primary/10'
                                : 'border-traffic-medium/20 hover:border-primary/50'
                            } ${
                              showResults && oIndex === question.correctAnswer
                                ? 'border-green-500 bg-green-500/10'
                                : showResults && quizAnswers[question.id] === oIndex && oIndex !== question.correctAnswer
                                ? 'border-red-500 bg-red-500/10'
                                : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              checked={quizAnswers[question.id] === oIndex}
                              onChange={() => handleQuizAnswer(question.id, oIndex)}
                              disabled={showResults}
                              className="w-4 h-4"
                            />
                            <span className="flex-1">{option}</span>
                            {showResults && oIndex === question.correctAnswer && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {showResults && quizAnswers[question.id] === oIndex && oIndex !== question.correctAnswer && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </label>
                        ))}
                      </div>

                      {showResults && (
                        <Card className="p-3 bg-muted/50">
                          <p className="text-sm">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </Card>
                      )}
                    </div>
                  </Card>
                ))}

                <div className="flex justify-between">
                  <Button onClick={handlePreviousStep} variant="outline">
                    Back to Tutorial
                  </Button>
                  {!showResults ? (
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(quizAnswers).length !== activeTutorialData?.quiz.questions.length}
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button onClick={() => setActiveTutorial(null)}>
                      Complete Tutorial
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EducationalMode;
