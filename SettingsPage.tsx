import { SchoolBackground } from '@/components/ui/school-background';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, MapPin, User, Phone, School } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your app preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5" />
            Kotalpur High School
          </CardTitle>
          <CardDescription>
            The inspiration behind this study kit application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg overflow-hidden border-2 border-primary/20">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-8isd6x76cw76/conv-8z3d3tngy9ds/20260117/file-8zu2gjbl61vk.png"
              alt="Kotalpur High School Building"
              className="w-full h-auto object-cover"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Kotalpur High School - Where excellence meets dedication
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>
            Application information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Kotalpur High School Study Kit</p>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">
              Your AI-powered learning companion for serious academic improvement.
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">
              © 2026 Kotalpur High School Study Kit. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Creator</CardTitle>
          <CardDescription>
            Developed with dedication for student success
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary shrink-0">
              <img 
                src="/assets/creator-photo.png" 
                alt="Debraj Dutta"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Debraj Dutta</p>
                  <p className="text-xs text-muted-foreground">Application Developer</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Debraj Dutta's house, Kalikapur, Kumrul<br />
                  Hooghly, West Bengal, India
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a 
                  href="mailto:debrajdutta200@gmail.com" 
                  className="text-sm text-primary hover:underline"
                >
                  debrajdutta200@gmail.com
                </a>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a 
                  href="tel:+918536943389" 
                  className="text-sm text-primary hover:underline"
                >
                  +91 8536943389
                </a>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground italic">
              "Built with passion to empower students in their academic journey. 
              This application represents dedication to quality education and student success."
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Mentor & Idea Maker</CardTitle>
          <CardDescription>
            The visionary behind this educational initiative
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary shrink-0">
              <img 
                src="/assets/mentor-photo.png" 
                alt="Sunil Saren"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Sunil Saren</p>
                  <p className="text-xs text-muted-foreground">Faculty Mentor - Kotalpur High School</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a 
                  href="tel:+919735729809" 
                  className="text-sm text-primary hover:underline"
                >
                  +91 9735729809
                </a>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-medium mb-2">📞 Need Help or Suggestions?</p>
            <p className="text-xs text-muted-foreground">
              Students can contact Sir Sunil Saren for any academic guidance, 
              suggestions, or assistance related to their studies. Available for 
              student support and educational consultation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
