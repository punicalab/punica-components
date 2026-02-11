import { useRef, useEffect, useState } from 'react';
import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

type ViewType = 'day' | 'week' | 'month' | 'year';

interface AgendaEvent {
  name: string;
  startDate: Date | string;
  endDate: Date | string;
}

interface PunicaAgendaElement extends HTMLElement {
  setEvents: (events: AgendaEvent[]) => void;
  setView: (view: ViewType) => void;
  setCurrentDate: (date: Date) => void;
  navigate: (direction: number) => void;
  getLocale: () => string;
  setLocale: (locale: string) => void;
  getTimeRange: () => {
    startMin: number;
    endMin: number;
    start: string;
    end: string;
  };
  setTimeRange: (range: {
    start?: string;
    end?: string;
    startHour?: number;
    endHour?: number;
    startMin?: number;
    endMin?: number;
  }) => void;
}

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const formatDateLabel = (
  date: Date,
  view: ViewType,
  locale: string = 'en-US'
) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  switch (view) {
    case 'day':
      return date.toLocaleDateString(locale, options);
    case 'week': {
      const weekStart = getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short'
      })} - ${weekEnd.toLocaleDateString(locale, options)}`;
    }
    case 'month':
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long'
      });
    case 'year':
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString(locale, options);
  }
};

const createSampleEvents = (): AgendaEvent[] => {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  return [
    {
      name: 'Sabah Toplantısı',
      startDate: new Date(y, m, d, 9, 0),
      endDate: new Date(y, m, d, 10, 0)
    },
    {
      name: 'Teknik Review',
      startDate: new Date(y, m, d, 9, 0),
      endDate: new Date(y, m, d, 9, 45)
    },
    {
      name: 'Design Sync',
      startDate: new Date(y, m, d, 9, 30),
      endDate: new Date(y, m, d, 10, 15)
    },
    {
      name: 'Proje Değerlendirme',
      startDate: new Date(y, m, d, 10, 30),
      endDate: new Date(y, m, d, 12, 0)
    },
    {
      name: 'Sprint Planning',
      startDate: new Date(y, m, d, 11, 0),
      endDate: new Date(y, m, d, 12, 30)
    },
    {
      name: 'Öğle Yemeği',
      startDate: new Date(y, m, d, 12, 0),
      endDate: new Date(y, m, d, 13, 0)
    },
    {
      name: 'Müşteri Görüşmesi',
      startDate: new Date(y, m, d, 14, 0),
      endDate: new Date(y, m, d, 15, 30)
    },
    {
      name: 'Ürün Demo',
      startDate: new Date(y, m, d, 14, 30),
      endDate: new Date(y, m, d, 15, 0)
    },
    {
      name: 'Code Review',
      startDate: new Date(y, m, d, 15, 0),
      endDate: new Date(y, m, d, 16, 0)
    },
    {
      name: 'Ekip Sync',
      startDate: new Date(y, m, d, 16, 0),
      endDate: new Date(y, m, d, 16, 30)
    },
    {
      name: 'Yarın Workshop',
      startDate: new Date(y, m, d + 1, 9, 0),
      endDate: new Date(y, m, d + 1, 12, 0)
    },
    {
      name: 'Geçen Hafta Notu',
      startDate: new Date(y, m, d - 3, 11, 0),
      endDate: new Date(y, m, d - 3, 12, 0)
    }
  ];
};

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: 'day', label: 'Günlük' },
  { value: 'week', label: 'Haftalık' },
  { value: 'month', label: 'Aylık' },
  { value: 'year', label: 'Yıllık' }
];

const LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'tr-TR', label: 'Türkçe' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'es-ES', label: 'Español' }
];

const Module = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const agendaRef = useRef<PunicaAgendaElement | null>(null);
  const [view, setViewState] = useState<ViewType>('day');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [locale, setLocaleState] = useState('en-US');
  const [sampleEvents] = useState(() => createSampleEvents());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(
      'punica-agenda'
    ) as NodeListOf<PunicaAgendaElement>;

    if (!elements.length) return;

    elements.forEach((el, index) => {
      if (index === 0) {
        // First agenda: full feature, full day
        agendaRef.current = el;
      }

      el.setEvents(sampleEvents);
      el.setView(view);
      el.setCurrentDate(currentDate);
      el.setLocale(locale);

      if (index === 1) {
        // Second agenda: limited time range (09:00–16:00)
        el.setTimeRange({ start: '09:00', end: '16:00' });
      } else {
        // Full-day agenda
        el.setTimeRange({ startMin: 0, endMin: 24 * 60 });
      }
    });
  }, [sampleEvents, view, currentDate, locale]);

  const navigate = (direction: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      switch (view) {
        case 'day':
          d.setDate(d.getDate() + direction);
          break;
        case 'week':
          d.setDate(d.getDate() + direction * 7);
          break;
        case 'month':
          d.setMonth(d.getMonth() + direction);
          break;
        case 'year':
          d.setFullYear(d.getFullYear() + direction);
          break;
      }
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  return (
    <Layout.Main>
      <Layout.Header title={t('component.agenda')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderBottom: '1px solid #e0e0e0',
                background: '#fafafa',
                borderRadius: '8px 8px 0 0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}
              >
                {VIEW_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setViewState(value)}
                    style={{
                      padding: '8px 16px',
                      border: `1px solid ${
                        view === value ? '#1976d2' : '#e0e0e0'
                      }`,
                      background: view === value ? '#1976d2' : '#fff',
                      color: view === value ? '#fff' : '#333',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {label}
                  </button>
                ))}
                <select
                  value={locale}
                  onChange={(e) => setLocaleState(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e0e0e0',
                    background: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginLeft: '8px'
                  }}
                >
                  {LOCALE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginLeft: 'auto'
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    background: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  aria-label="Önceki"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    minWidth: '200px',
                    textAlign: 'center'
                  }}
                >
                  {formatDateLabel(currentDate, view, locale)}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(1)}
                  style={{
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    background: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  aria-label="Sonraki"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e0e0e0',
                    background: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Bugün
                </button>
              </div>
            </div>
            <div
              ref={containerRef}
              style={{
                border: '1px solid #e0e0e0',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* 1) Full feature, full-day agenda */}
              <div
                style={{
                  minHeight: '320px',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <punica-agenda />
              </div>

              {/* 2) Limited time range agenda (09:00–16:00) */}
              <div
                style={{
                  marginTop: '200px',
                  minHeight: '320px',
                  background: '#fafafa'
                }}
              >
                <punica-agenda start-hour="9" end-hour="16" />
              </div>
            </div>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
