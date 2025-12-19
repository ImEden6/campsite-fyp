// Email Template Renderer using Handlebars

import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { EmailTemplateData } from './types';
import logger from '@/utils/logger';

export class TemplateRenderer {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private baseLayoutCache: HandlebarsTemplateDelegate | null = null;
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../../templates/emails');
  }

  /**
   * Render an email template with the given data
   */
  async render(templateName: string, data: EmailTemplateData): Promise<string> {
    try {
      // Load base layout
      const baseLayout = await this.loadBaseLayout();
      
      // Load template
      const template = await this.loadTemplate(templateName);
      
      // Render template content
      const templateContent = template(data);
      
      // Render with base layout
      const html = baseLayout({
        ...data,
        body: templateContent,
        year: new Date().getFullYear(),
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      });

      return html;
    } catch (error) {
      logger.error('Template rendering failed', { templateName, error });
      throw new Error(`Failed to render template: ${templateName}`);
    }
  }

  /**
   * Render verification email template
   */
  async renderVerificationEmail(
    email: string,
    firstName: string,
    verificationUrl: string
  ): Promise<string> {
    return this.render('verification-email', {
      email,
      firstName,
      verificationUrl,
      title: 'Verify Your Email',
    });
  }

  /**
   * Render password reset email template
   */
  async renderPasswordResetEmail(
    email: string,
    firstName: string,
    resetUrl: string
  ): Promise<string> {
    return this.render('password-reset', {
      email,
      firstName,
      resetUrl,
      title: 'Reset Your Password',
    });
  }

  /**
   * Load base layout template
   */
  private async loadBaseLayout(): Promise<HandlebarsTemplateDelegate> {
    if (this.baseLayoutCache) {
      return this.baseLayoutCache;
    }

    const layoutPath = path.join(this.templatesDir, 'layouts', 'base.hbs');
    const layoutContent = await fs.readFile(layoutPath, 'utf-8');
    this.baseLayoutCache = Handlebars.compile(layoutContent);

    return this.baseLayoutCache;
  }

  /**
   * Load and compile a template
   */
  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    // Check cache
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // Load template file
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // Compile template
    const compiled = Handlebars.compile(templateContent);
    
    // Cache compiled template
    this.templateCache.set(templateName, compiled);

    return compiled;
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.baseLayoutCache = null;
  }

  /**
   * Register custom Handlebars helpers
   */
  registerHelpers(): void {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Format currency helper
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
  }
}

// Export singleton instance
export const templateRenderer = new TemplateRenderer();

// Register helpers on initialization
templateRenderer.registerHelpers();
