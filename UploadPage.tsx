import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadApi, subjectApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle2, FileImage } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Subject } from '@/types';
import { useEffect } from 'react';
import { uploadImage, validateImageFile } from '@/services/imageUpload';
import { extractTextFromImage } from '@/services/aiClient';

export default function UploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<{
    text: string;
    concepts: string[];
    chapter: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    subjectApi.getSubjects(user.id).then(setSubjects);
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image will be compressed to under 1MB',
      });
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExtractedData(null);
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    // Use the centralized upload service
    if (!user) throw new Error('User not authenticated');
    
    const result = await uploadImage(file, user.id, (progress) => {
      // Progress is handled by the main upload function
    });
    
    return result.url;
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Supabase Storage
      setUploadProgress(30);
      const uploadedUrl = await uploadToSupabase(selectedFile);
      
      setUploadProgress(50);

      // Create upload record
      const upload = await uploadApi.createUpload(
        user.id,
        uploadedUrl,
        selectedSubject || undefined
      );

      setUploadProgress(70);

      // Extract text using OCR
      setProcessing(true);
      const ocrData = await extractTextFromImage({ imageUrl: uploadedUrl });

      setUploadProgress(90);

      // Update upload with extracted data
      await uploadApi.updateUpload(upload.id, {
        extracted_text: ocrData.extractedText,
        detected_concepts: ocrData.concepts,
        chapter_name: ocrData.chapter
      });

      setExtractedData({
        text: ocrData.extractedText,
        concepts: ocrData.concepts,
        chapter: ocrData.chapter
      });

      setUploadProgress(100);

      toast({
        title: 'Upload Successful! ✅',
        description: 'Text extracted successfully'
      });

      // Navigate to explain page with the upload ID
      setTimeout(() => {
        navigate(`/explain?uploadId=${upload.id}`);
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to process image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload Textbook Page</h1>
        <p className="text-muted-foreground">
          Upload a photo of your textbook to extract text and get AI explanations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
          <CardDescription>
            Take a clear photo of the textbook page you want to study
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Image File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {!previewUrl ? (
                <div className="space-y-4">
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP up to 1MB
                      </div>
                    </Label>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-96 mx-auto rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setExtractedData(null);
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              )}
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {processing ? 'Extracting text...' : 'Uploading...'}
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {extractedData && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Text extracted successfully!</p>
                  {extractedData.chapter && (
                    <p className="text-sm">Chapter: {extractedData.chapter}</p>
                  )}
                  {extractedData.concepts.length > 0 && (
                    <p className="text-sm">
                      Concepts: {extractedData.concepts.join(', ')}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processing ? 'Processing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload and Extract Text
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Ensure good lighting and clear focus</li>
            <li>✓ Capture the entire page or section</li>
            <li>✓ Avoid shadows and glare</li>
            <li>✓ Keep the page flat and straight</li>
            <li>✓ Use high resolution for better text extraction</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
