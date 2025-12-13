import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  Shield,
  Clock,
  Star,
  Users,
  Tent,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import { mockSites } from '@/services/api/mock-sites';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { format } from 'date-fns';
import { SiteCard } from '@/features/sites/components/SiteCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Fetch featured sites
  const { data: sites = [], isLoading: isLoadingSites, error: sitesError } = useQuery({
    queryKey: queryKeys.sites.all,
    queryFn: async () => {
      try {
        const apiSites = await getSites();
        return apiSites.length > 0 ? apiSites : mockSites;
      } catch {
        return mockSites;
      }
    },
  });

  const popularSites = sites.slice(0, 3);

  const handleSearch = () => {
    // Validate dates
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      if (checkOut <= checkIn) {
        alert('Check-out date must be after check-in date');
        return;
      }
    }
    
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (checkInDate) params.set('checkIn', checkInDate);
    if (checkOutDate) params.set('checkOut', checkOutDate);
    navigate(`/sites?${params.toString()}`);
  };

  const handleBookNow = (siteId: string) => {
    if (isAuthenticated) {
      navigate(`/customer/bookings/new?siteId=${siteId}`);
    } else {
      navigate(`/book/guest?siteId=${siteId}`);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure Booking',
      description: 'Safe and secure payment processing with instant confirmation',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: Clock,
      title: 'Instant Confirmation',
      description: 'Get immediate booking confirmation and access to your reservation',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Star,
      title: 'Verified Sites',
      description: 'All campsites are verified and regularly maintained for quality',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      icon: Users,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your camping needs',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Browse Sites',
      description: 'Explore our wide selection of campsites with detailed information and photos',
      icon: Search,
    },
    {
      step: 2,
      title: 'Select Dates',
      description: 'Choose your check-in and check-out dates with real-time availability',
      icon: Calendar,
    },
    {
      step: 3,
      title: 'Book & Pay',
      description: 'Complete your booking with secure payment - no account required',
      icon: Shield,
    },
    {
      step: 4,
      title: 'Enjoy Your Stay',
      description: 'Receive confirmation and enjoy your camping adventure',
      icon: Tent,
    },
  ];

  const stats = [
    { label: 'Available Sites', value: sites.length > 0 ? sites.length.toString() : '50+', icon: MapPin },
    { label: 'Happy Campers', value: '10,000+', icon: Users },
    { label: 'Average Rating', value: '4.8', icon: Star },
    { label: 'Years Experience', value: '10+', icon: Award },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      location: 'Seattle, WA',
      rating: 5,
      text: 'Amazing experience! The booking process was seamless and the campsite exceeded our expectations. Will definitely book again!',
      avatar: 'SJ',
    },
    {
      name: 'Mike Chen',
      location: 'Portland, OR',
      rating: 5,
      text: 'Best camping platform I\'ve used. Real-time availability and instant confirmation made planning our trip so easy.',
      avatar: 'MC',
    },
    {
      name: 'Emily Rodriguez',
      location: 'San Francisco, CA',
      rating: 5,
      text: 'The site details were accurate and the amenities were exactly as described. Great customer service too!',
      avatar: 'ER',
    },
  ];

  const faqs = [
    {
      question: 'Do I need to create an account to book?',
      answer: 'No! You can book as a guest without creating an account. However, creating an account allows you to manage your bookings, view history, and get faster checkout.',
    },
    {
      question: 'What is your cancellation policy?',
      answer: 'Cancellations made 7+ days before check-in receive a full refund. Cancellations 3-7 days before receive 50% refund. Cancellations within 3 days are non-refundable.',
    },
    {
      question: 'Can I modify my booking after confirmation?',
      answer: 'Yes! You can modify your booking dates, number of guests, or add equipment. Price differences will be calculated and charged or refunded accordingly.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.',
    },
    {
      question: 'Are pets allowed at the campsites?',
      answer: 'Many of our sites are pet-friendly. Look for the pet-friendly badge when browsing sites. Additional fees may apply.',
    },
    {
      question: 'What amenities are included?',
      answer: 'Amenities vary by site but may include electricity, water, sewer, WiFi, restrooms, and more. Check individual site listings for full details.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-900 dark:via-blue-950 dark:to-gray-900 text-white py-20 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Discover Your Perfect Campsite</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Next Adventure
              <br />
              <span className="text-blue-200">Awaits</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto">
              Find and book the perfect campsite for your outdoor adventure. 
              Real-time availability, instant booking, and secure payments.
            </p>

            {/* Search Bar */}
            <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Sites
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search by name, location, or amenities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="pl-10 text-gray-900 dark:text-gray-100"
                      aria-label="Search sites"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check In
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="pl-10 text-gray-900 dark:text-gray-100"
                      aria-label="Check-in date"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check Out
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || format(new Date(), 'yyyy-MM-dd')}
                      className="pl-10 text-gray-900 dark:text-gray-100"
                      aria-label="Check-out date"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleSearch}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Search Sites
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  onClick={() => navigate('/sites')}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600"
                  size="lg"
                >
                  Browse All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3">
                  <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need for a seamless camping booking experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.bgColor} rounded-xl mb-4`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Book your perfect campsite in just four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4 relative z-10">
                    {step.step}
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-blue-200 dark:bg-blue-800 -z-0" style={{ width: 'calc(100% - 4rem)', marginLeft: 'calc(50% + 2rem)' }} />
                  )}
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4">
                    <step.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Sites Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Popular Campsites
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Handpicked sites loved by our campers
              </p>
            </div>
            <Button
              onClick={() => navigate('/sites')}
              variant="outline"
              className="hidden md:flex"
            >
              View All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {isLoadingSites ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Loading sites...</p>
            </div>
          ) : sitesError ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to load sites</p>
              <p className="text-gray-600 dark:text-gray-400">Please try again later</p>
            </div>
          ) : popularSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularSites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onViewDetails={() => navigate(`/sites/${site.id}`)}
                  onSelect={() => handleBookNow(site.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No sites available at the moment</p>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button
              onClick={() => navigate('/sites')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View All Sites
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              What Our Campers Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Don't just take our word for it - hear from our happy campers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Everything you need to know about booking with us
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  aria-expanded={openFaqIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {faq.question}
                  </span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div id={`faq-answer-${index}`} className="px-6 pb-4 text-gray-600 dark:text-gray-400" role="region">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join thousands of happy campers and discover your perfect campsite today. 
            Book instantly with secure payments and instant confirmation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/sites')}
              className="bg-white text-blue-600 hover:bg-gray-100"
              size="lg"
            >
              Browse All Sites
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {!isAuthenticated && (
              <Button
                onClick={() => navigate('/register')}
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                size="lg"
              >
                Create Account
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
