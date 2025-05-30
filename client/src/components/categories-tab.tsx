import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Word } from "@shared/schema";

export default function CategoriesTab() {
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const { data: allWords = [] } = useQuery<Word[]>({
    queryKey: ['/api/words'],
  });

  const getCategoryData = (category: string) => {
    const categoryWords = allWords.filter(word => word.category === category);
    const learnedCount = categoryWords.filter(word => word.isFavorite).length;
    const progress = categoryWords.length > 0 ? Math.round((learnedCount / categoryWords.length) * 100) : 0;
    
    return {
      name: category,
      wordCount: categoryWords.length,
      progress,
      description: `Learn German ${category.toLowerCase()} vocabulary`,
      icon: getCategoryIcon(category),
      color: getCategoryColor(category),
    };
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Animals': 'paw',
      'Food': 'utensils',
      'Home': 'home',
      'Colors': 'palette',
      'Family': 'users',
      'Travel': 'plane',
      'Work': 'briefcase',
      'School': 'graduation-cap',
    };
    return iconMap[category] || 'folder';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'Animals': 'text-green-600 bg-green-100',
      'Food': 'text-orange-600 bg-orange-100',
      'Home': 'text-blue-600 bg-blue-100',
      'Colors': 'text-purple-600 bg-purple-100',
      'Family': 'text-pink-600 bg-pink-100',
      'Travel': 'text-indigo-600 bg-indigo-100',
      'Work': 'text-gray-600 bg-gray-100',
      'School': 'text-yellow-600 bg-yellow-100',
    };
    return colorMap[category] || 'text-gray-600 bg-gray-100';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map((category) => {
        const categoryData = getCategoryData(category);
        
        return (
          <Card 
            key={category} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              // TODO: Navigate to category details or filter word list
              console.log('Open category:', category);
            }}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${categoryData.color}`}>
                  <i className={`fas fa-${categoryData.icon} text-2xl`}></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">{categoryData.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{categoryData.description}</p>
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-muted-foreground">{categoryData.wordCount} words</span>
                  <Badge 
                    variant={categoryData.progress >= 70 ? "default" : "secondary"}
                    className={categoryData.progress >= 70 ? "bg-green-500" : ""}
                  >
                    {categoryData.progress}% learned
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(categoryData.progress)}`}
                    style={{ width: `${categoryData.progress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {categories.length === 0 && (
        <div className="col-span-full">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <i className="fas fa-tags text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium mb-2">No categories found</h3>
                <p className="text-muted-foreground">
                  Add some words to create categories automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
