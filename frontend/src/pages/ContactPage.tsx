import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send } from "lucide-react";

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/contact", form);
      if (res.ok) {
        toast({ title: "Message sent!", description: "We'll get back to you at hello@forgevibeapp.com" });
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        toast({ title: "Failed to send", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Contact Us</h1>
        <p className="text-muted-foreground text-sm">
          Questions, feedback, or partnership inquiries? We'd love to hear from you.
        </p>
        <div className="flex items-center gap-2 mt-3 text-sm text-primary">
          <Mail className="w-4 h-4" />
          <span>hello@forgevibeapp.com</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Subject</label>
          <input
            required
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="What's this about?"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Message</label>
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Tell us more..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <Button type="submit" disabled={sending} className="w-full gap-2">
          <Send className="w-4 h-4" />
          {sending ? "Sending…" : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
