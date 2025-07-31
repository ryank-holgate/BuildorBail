import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertAppIdeaSchema, type InsertAppIdea, type ValidationResultWithIdea } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface ValidationFormProps {
  onValidationStart: () => void;
  onValidationComplete: (result: ValidationResultWithIdea) => void;
  isLoading: boolean;
}

export default function ValidationForm({ onValidationStart, onValidationComplete, isLoading }: ValidationFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertAppIdea>({
    resolver: zodResolver(insertAppIdeaSchema),
    defaultValues: {
      appName: "",
      userName: "",
      description: "",
      targetMarket: "",
      budget: "",
      features: "",
      competition: "",
      agreeToTerms: false,
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (data: InsertAppIdea): Promise<ValidationResultWithIdea> => {
      const response = await apiRequest("POST", "/api/validate", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Validation Complete!",
        description: "Your app idea has been analyzed. Check out the results below.",
      });
      onValidationComplete(result);
      form.reset();
    },
    onError: (error) => {
      console.error("Validation error:", error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to validate your app idea. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAppIdea) => {
    onValidationStart();
    validateMutation.mutate(data);
  };

  return (
    <section id="validate" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready for the Truth?</h2>
          <p className="text-xl text-gray-600">Fill out the form below and get honest feedback in minutes</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        App Name *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., TaskMaster Pro" 
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Your Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Optional" 
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      App Description *
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your app in 2-3 sentences. What does it do? What problem does it solve?" 
                        rows={4}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="targetMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Target Market *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors">
                            <SelectValue placeholder="Select target market" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consumers">Consumers (B2C)</SelectItem>
                          <SelectItem value="businesses">Businesses (B2B)</SelectItem>
                          <SelectItem value="developers">Developers</SelectItem>
                          <SelectItem value="students">Students</SelectItem>
                          <SelectItem value="professionals">Professionals</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Budget Range
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors">
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="under-5k">Under $5,000</SelectItem>
                          <SelectItem value="5k-15k">$5,000 - $15,000</SelectItem>
                          <SelectItem value="15k-50k">$15,000 - $50,000</SelectItem>
                          <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                          <SelectItem value="over-100k">Over $100,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Key Features
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the main features you plan to include (optional but recommended)" 
                        rows={3}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="competition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Competition Analysis
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What similar apps exist? How will yours be different?" 
                        rows={3}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm text-gray-600">
                        I understand this will be brutally honest feedback and I'm prepared for constructive criticism about my idea.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className="text-center">
                <Button 
                  type="submit" 
                  disabled={isLoading || validateMutation.isPending}
                  className="bg-red-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading || validateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-brain mr-2"></i>
                      Get Brutal Feedback
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-3">Analysis takes 30-60 seconds</p>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
