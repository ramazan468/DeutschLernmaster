import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TestMode, TestType, TestSource } from "@shared/schema";

export default function TestTab() {
  const [selectedTestMode, setSelectedTestMode] = useState<TestMode>('artikel');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState<string>('');
  const [testType, setTestType] = useState<TestType>('multiple');
  const [testSource, setTestSource] = useState<TestSource>('wordlist');

  const testModes = [
    { id: 'artikel', label: 'Artikel', icon: 'font' },
    { id: 'plural', label: 'Plural Forms', icon: 'layer-group' },
    { id: 'tr-de', label: 'TR → DE', icon: 'arrow-right' },
    { id: 'de-tr', label: 'DE → TR', icon: 'arrow-left' },
    { id: 'sentence', label: 'Sentences', icon: 'comments' },
    { id: 'wo', label: 'WO?', icon: 'question' },
    { id: 'wohin', label: 'WOHIN?', icon: 'location-arrow' },
    { id: 'woher', label: 'WOHER?', icon: 'undo' },
  ];

  const questionCounts = [5, 10, 15, 20];

  const handleStartTest = () => {
    const finalCount = customCount ? parseInt(customCount) : questionCount;
    console.log('Starting test with:', {
      mode: selectedTestMode,
      count: finalCount,
      type: testType,
      source: testSource,
    });
    // TODO: Implement test generation and navigation
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Test Modes */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-clipboard-check mr-2 text-primary"></i>
              Test Modes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {testModes.map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => setSelectedTestMode(mode.id as TestMode)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                    selectedTestMode === mode.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <i className={`fas fa-${mode.icon} text-2xl text-muted-foreground mb-2 block`}></i>
                  <p className="font-medium text-foreground">{mode.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Configuration */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-cog mr-2 text-primary"></i>
              Test Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Count */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Question Count</Label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {questionCounts.map((count) => (
                  <Button
                    key={count}
                    variant={questionCount === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setQuestionCount(count);
                      setCustomCount('');
                    }}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom count"
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
                min="1"
                max="100"
              />
            </div>

            {/* Test Type */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Test Type</Label>
              <RadioGroup value={testType} onValueChange={(value) => setTestType(value as TestType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="multiple" />
                  <Label htmlFor="multiple" className="text-sm">Multiple Choice</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fill" id="fill" />
                  <Label htmlFor="fill" className="text-sm">Fill in the Blank</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed" className="text-sm">Mixed</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Test Source */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Test Source</Label>
              <Select value={testSource} onValueChange={(value) => setTestSource(value as TestSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wordlist">Word List</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="favorites">Favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Test Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h4 className="font-medium mb-2">Test Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Mode: <span className="text-foreground">{testModes.find(m => m.id === selectedTestMode)?.label}</span></div>
                  <div>Questions: <span className="text-foreground">{customCount || questionCount}</span></div>
                  <div>Type: <span className="text-foreground">{testType === 'multiple' ? 'Multiple Choice' : testType === 'fill' ? 'Fill in the Blank' : 'Mixed'}</span></div>
                  <div>Source: <span className="text-foreground">{testSource === 'wordlist' ? 'Word List' : testSource === 'category' ? 'Category' : 'Favorites'}</span></div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleStartTest} className="w-full">
              <i className="fas fa-play mr-2"></i>
              Start Test
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
