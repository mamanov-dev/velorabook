'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Heart, Users, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBook } from '@/contexts/BookContext';
import ImageUploader from '@/components/ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'file';
  placeholder?: string;
  required: boolean;
}

interface BookType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  price: string;
  questions: Question[];
}

const bookTypes: BookType[] = [
  {
    id: 'romantic',
    title: 'Романтическая книга',
    description: 'Для второй половинки',
    icon: Heart,
    price: '2,990₽',
    questions: [
      {
        id: 'partner_name',
        text: 'Как зовут вашу вторую половинку?',
        type: 'text',
        placeholder: 'Полное имя или как вы обращаетесь дома',
        required: true
      },
      {
        id: 'relationship_duration',
        text: 'Как долго вы вместе?',
        type: 'text',
        placeholder: '2 года, 6 месяцев, с 2019 года...',
        required: true
      },
      {
        id: 'partner_appearance',
        text: 'Опишите внешность партнера - что в ней особенного?',
        type: 'textarea',
        placeholder: 'Глаза, улыбка, жесты... Что заставляет ваше сердце трепетать? (минимум 50 слов)',
        required: true
      },
      {
        id: 'first_meeting_place',
        text: 'Где и как вы познакомились?',
        type: 'textarea',
        placeholder: 'Опишите место, обстановку, погоду, ваше настроение... (минимум 60 слов)',
        required: true
      },
      {
        id: 'first_impression',
        text: 'Какое первое впечатление произвел на вас партнер?',
        type: 'textarea',
        placeholder: 'Что почувствовали? О чем подумали? Что запомнилось больше всего? (минимум 50 слов)',
        required: true
      },
      {
        id: 'first_conversation',
        text: 'О чем вы говорили при первом знакомстве?',
        type: 'textarea',
        placeholder: 'Первые слова, темы разговора, что вас удивило в собеседнике... (минимум 40 слов)',
        required: true
      },
      {
        id: 'first_date_story',
        text: 'Расскажите детально о вашем первом свидании',
        type: 'textarea',
        placeholder: 'Куда пошли, что делали, о чем говорили, какие эмоции испытывали... (минимум 80 слов)',
        required: true
      },
      {
        id: 'moment_of_love_realization',
        text: 'Когда и как вы поняли, что влюбились?',
        type: 'textarea',
        placeholder: 'Опишите этот переломный момент - где были, что происходило, что почувствовали... (минимум 70 слов)',
        required: true
      },
      {
        id: 'partner_scent',
        text: 'Какой запах ассоциируется у вас с партнером?',
        type: 'textarea',
        placeholder: 'Духи, естественный запах, или может быть кофе по утрам... (минимум 30 слов)',
        required: true
      },
      {
        id: 'partner_laugh',
        text: 'Опишите смех вашего партнера',
        type: 'textarea',
        placeholder: 'Как звучит, когда чаще всего смеется, что вас в нем трогает... (минимум 40 слов)',
        required: true
      },
      {
        id: 'partner_habits',
        text: 'Какие милые привычки есть у вашего партнера?',
        type: 'textarea',
        placeholder: 'Жесты, слова, ритуалы... То, что делает его особенным (минимум 50 слов)',
        required: true
      },
      {
        id: 'partner_best_qualities',
        text: 'За что вы любите своего партнера больше всего?',
        type: 'textarea',
        placeholder: 'Черты характера, поступки, качества души... (минимум 60 слов)',
        required: true
      },
      {
        id: 'difficult_moment_support',
        text: 'Как партнер поддержал вас в трудную минуту?',
        type: 'textarea',
        placeholder: 'Конкретная ситуация, когда почувствовали его заботу и любовь... (минимум 60 слов)',
        required: true
      },
      {
        id: 'happiest_moment_together',
        text: 'Самый счастливый момент в ваших отношениях',
        type: 'textarea',
        placeholder: 'Опишите подробно: где, когда, что происходило, какие эмоции... (минимум 80 слов)',
        required: true
      },
      {
        id: 'funniest_memory',
        text: 'Самая смешная история из ваших отношений',
        type: 'textarea',
        placeholder: 'Ситуация, над которой вы до сих пор смеетесь вместе... (минимум 70 слов)',
        required: true
      },
      {
        id: 'romantic_gesture',
        text: 'Самый романтичный поступок партнера',
        type: 'textarea',
        placeholder: 'Сюрприз, подарок, или просто особенный жест... Что растрогало до слез? (минимум 60 слов)',
        required: true
      },
      {
        id: 'daily_romance',
        text: 'Как романтика проявляется в вашей повседневной жизни?',
        type: 'textarea',
        placeholder: 'Маленькие знаки внимания, ритуалы, способы заботы... (минимум 50 слов)',
        required: true
      },
      {
        id: 'special_places',
        text: 'Ваши особенные места и почему они важны',
        type: 'textarea',
        placeholder: 'Места с историей: где познакомились, первое свидание, важные моменты... (минимум 60 слов)',
        required: true
      },
      {
        id: 'couple_traditions',
        text: 'Какие традиции и ритуалы есть только у вас двоих?',
        type: 'textarea',
        placeholder: 'Особые дни, способы прощания, домашние традиции... (минимум 50 слов)',
        required: true
      },
      {
        id: 'love_language',
        text: 'Как вы выражаете любовь друг к другу?',
        type: 'textarea',
        placeholder: 'Слова, прикосновения, подарки, поступки... Ваш уникальный язык любви (минимум 50 слов)',
        required: true
      },
      {
        id: 'overcoming_difficulties',
        text: 'Как вы преодолели самый сложный период в отношениях?',
        type: 'textarea',
        placeholder: 'Что случилось, как справлялись, что вас объединило еще больше... (минимум 70 слов)',
        required: true
      },
      {
        id: 'growth_together',
        text: 'Как вы изменились благодаря этим отношениям?',
        type: 'textarea',
        placeholder: 'Что нового открыли в себе, чему научились друг у друга... (минимум 60 слов)',
        required: true
      },
      {
        id: 'shared_dreams',
        text: 'О чем вы мечтаете вместе?',
        type: 'textarea',
        placeholder: 'Планы, цели, места которые хотите посетить, жизнь которую строите... (минимум 60 слов)',
        required: true
      },
      {
        id: 'perfect_day',
        text: 'Опишите ваш идеальный день вдвоем',
        type: 'textarea',
        placeholder: 'С утра до вечера - что бы делали, где были, как проводили время... (минимум 70 слов)',
        required: true
      },
      {
        id: 'gratitude',
        text: 'За что вы больше всего благодарны партнеру?',
        type: 'textarea',
        placeholder: 'Что он привнес в вашу жизнь, как изменил ее к лучшему... (минимум 60 слов)',
        required: true
      },
      {
        id: 'future_vision',
        text: 'Как вы видите вашу совместную жизнь через 10 лет?',
        type: 'textarea',
        placeholder: 'Мечты о будущем, каким видите партнера, какой будет ваша любовь... (минимум 60 слов)',
        required: true
      },
      {
        id: 'love_declaration',
        text: 'Ваши самые важные слова любви партнеру',
        type: 'textarea',
        placeholder: 'То, что хотите сказать прямо сейчас, от всего сердца... (минимум 80 слов)',
        required: true
      },
      {
        id: 'photos',
        text: 'Загрузите ваши самые дорогие совместные фотографии',
        type: 'file',
        required: true
      }
    ]
  },
  {
    id: 'family',
    title: 'Семейная хроника',
    description: 'Для всей семьи',
    icon: Users,
    price: '3,990₽',
    questions: [
      {
        id: 'family_members',
        text: 'Расскажите о всех членах семьи',
        type: 'textarea',
        placeholder: 'Имена, возраст, роли в семье, характеры... (минимум 60 слов)',
        required: true
      },
      {
        id: 'family_origin_story',
        text: 'История создания вашей семьи',
        type: 'textarea',
        placeholder: 'Как познакомились родители, их свадьба, первые годы вместе... (минимум 80 слов)',
        required: true
      },
      {
        id: 'family_roots',
        text: 'Откуда родом ваша семья?',
        type: 'textarea',
        placeholder: 'География, культурные корни, семейные легенды о предках... (минимум 50 слов)',
        required: true
      },
      {
        id: 'grandparents_stories',
        text: 'Расскажите о дедушках и бабушках',
        type: 'textarea',
        placeholder: 'Их характеры, истории, мудрость которую передали... (минимум 70 слов)',
        required: true
      },
      {
        id: 'childhood_home',
        text: 'Опишите дом, где выросли дети',
        type: 'textarea',
        placeholder: 'Комнаты, уютные уголки, запахи, звуки... Что делало его особенным? (минимум 60 слов)',
        required: true
      },
      {
        id: 'family_traditions',
        text: 'Главные семейные традиции',
        type: 'textarea',
        placeholder: 'Праздники, ритуалы, особые дни... Как вы их отмечаете? (минимум 70 слов)',
        required: true
      },
      {
        id: 'holiday_memories',
        text: 'Самые яркие воспоминания о семейных праздниках',
        type: 'textarea',
        placeholder: 'Новый год, дни рождения, юбилеи... Что делало их незабываемыми? (минимум 80 слов)',
        required: true
      },
      {
        id: 'family_cooking',
        text: 'Семейные рецепты и кулинарные традиции',
        type: 'textarea',
        placeholder: 'Фирменные блюда, секретные рецепты, кто что готовит лучше всех... (минимум 50 слов)',
        required: true
      },
      {
        id: 'family_sayings',
        text: 'Особенные слова и выражения в вашей семье',
        type: 'textarea',
        placeholder: 'Домашние прозвища, смешные фразы, семейный сленг... (минимум 40 слов)',
        required: true
      },
      {
        id: 'memorable_family_trips',
        text: 'Незабываемые семейные путешествия',
        type: 'textarea',
        placeholder: 'Куда ездили, что больше всего запомнилось, смешные случаи в дороге... (минимум 80 слов)',
        required: true
      },
      {
        id: 'family_milestones',
        text: 'Важные события в жизни семьи',
        type: 'textarea',
        placeholder: 'Первые шаги детей, выпускные, свадьбы, рождения... (минимум 70 слов)',
        required: true
      },
      {
        id: 'difficult_times',
        text: 'Как семья проходила через трудные времена?',
        type: 'textarea',
        placeholder: 'Сложные периоды и как вы поддерживали друг друга... (минимум 60 слов)',
        required: true
      },
      {
        id: 'family_strengths',
        text: 'В чем сила вашей семьи?',
        type: 'textarea',
        placeholder: 'Что вас объединяет, какие качества помогают быть вместе... (минимум 50 слов)',
        required: true
      },
      {
        id: 'family_values',
        text: 'Главные ценности вашей семьи',
        type: 'textarea',
        placeholder: 'Принципы, убеждения, что считаете самым важным в жизни... (минимум 60 слов)',
        required: true
      },
      {
        id: 'parents_wisdom',
        text: 'Какие уроки дали вам родители?',
        type: 'textarea',
        placeholder: 'Жизненная мудрость, советы, принципы которые передали... (минимум 60 слов)',
        required: true
      },
      {
        id: 'children_personalities',
        text: 'Расскажите о характерах детей в семье',
        type: 'textarea',
        placeholder: 'Кто какой, забавные особенности, таланты, мечты каждого... (минимум 70 слов)',
        required: true
      },
      {
        id: 'family_humor',
        text: 'Самые смешные семейные истории',
        type: 'textarea',
        placeholder: 'Курьезы, над которыми смеетесь всей семьей до сих пор... (минимум 60 слов)',
        required: true
      },
      {
        id: 'everyday_moments',
        text: 'Особенная красота обычных дней',
        type: 'textarea',
        placeholder: 'Утренние ритуалы, вечерние разговоры, семейные ужины... (минимум 50 слов)',
        required: true
      },
      {
        id: 'support_system',
        text: 'Как вы поддерживаете друг друга?',
        type: 'textarea',
        placeholder: 'Способы заботы, как помогаете в трудностях, радуетесь успехам... (минимум 60 слов)',
        required: true
      },
      {
        id: 'family_dreams',
        text: 'О чем мечтает ваша семья?',
        type: 'textarea',
        placeholder: 'Общие планы, цели, места которые хотите посетить вместе... (минимум 50 слов)',
        required: true
      },
      {
        id: 'legacy_hopes',
        text: 'Что хотите передать следующим поколениям?',
        type: 'textarea',
        placeholder: 'Традиции, ценности, мудрость которую важно сохранить... (минимум 60 слов)',
        required: true
      },
      {
        id: 'gratitude_family',
        text: 'За что вы больше всего благодарны своей семье?',
        type: 'textarea',
        placeholder: 'Что дает вам семья, как она обогащает жизнь каждого... (минимум 70 слов)',
        required: true
      },
      {
        id: 'family_photos',
        text: 'Загрузите самые дорогие семейные фотографии',
        type: 'file',
        required: true
      }
    ]
  },
  {
    id: 'friendship',
    title: 'Книга дружбы',
    description: 'Для лучших друзей',
    icon: BookOpen,
    price: '2,490₽',
    questions: [
      {
        id: 'friend_name',
        text: 'Как зовут вашего друга?',
        type: 'text',
        placeholder: 'Имя и как вы его называете',
        required: true
      },
      {
        id: 'friendship_duration',
        text: 'Как долго вы дружите?',
        type: 'text',
        placeholder: '5 лет, с детства, со школы...',
        required: true
      },
      {
        id: 'first_meeting',
        text: 'Как и где вы познакомились?',
        type: 'textarea',
        placeholder: 'Обстоятельства знакомства, первое впечатление друг о друге... (минимум 60 слов)',
        required: true
      },
      {
        id: 'friendship_beginning',
        text: 'Как развивалась ваша дружба?',
        type: 'textarea',
        placeholder: 'От знакомства к настоящей дружбе - ключевые моменты... (минимум 70 слов)',
        required: true
      },
      {
        id: 'friend_personality',
        text: 'Опишите характер вашего друга',
        type: 'textarea',
        placeholder: 'Что делает его особенным, уникальные черты характера... (минимум 60 слов)',
        required: true
      },
      {
        id: 'shared_interests',
        text: 'Что вас объединяет?',
        type: 'textarea',
        placeholder: 'Общие увлечения, интересы, взгляды на жизнь... (минимум 50 слов)',
        required: true
      },
      {
        id: 'friendship_qualities',
        text: 'За что вы цените этого друга больше всего?',
        type: 'textarea',
        placeholder: 'Качества, которые делают его незаменимым в вашей жизни... (минимум 60 слов)',
        required: true
      },
      {
        id: 'support_moments',
        text: 'Как друг поддерживал вас в трудные моменты?',
        type: 'textarea',
        placeholder: 'Конкретные ситуации, когда почувствовали его поддержку... (минимум 70 слов)',
        required: true
      },
      {
        id: 'shared_adventures',
        text: 'Ваши самые яркие совместные приключения',
        type: 'textarea',
        placeholder: 'Путешествия, походы, неожиданные ситуации... (минимум 80 слов)',
        required: true
      },
      {
        id: 'funny_moments',
        text: 'Самые смешные моменты вашей дружбы',
        type: 'textarea',
        placeholder: 'Истории, над которыми смеетесь до сих пор... (минимум 70 слов)',
        required: true
      },
      {
        id: 'inside_jokes',
        text: 'Ваши внутренние шутки и коды',
        type: 'textarea',
        placeholder: 'То, что понимаете только вы двое - фразы, жесты, воспоминания... (минимум 50 слов)',
        required: true
      },
      {
        id: 'growth_together',
        text: 'Как вы выросли благодаря этой дружбе?',
        type: 'textarea',
        placeholder: 'Чему научились друг у друга, как изменились... (минимум 60 слов)',
        required: true
      },
      {
        id: 'distance_friendship',
        text: 'Как поддерживаете дружбу на расстоянии?',
        type: 'textarea',
        placeholder: 'Способы оставаться близкими, несмотря на обстоятельства... (минимум 50 слов)',
        required: true
      },
      {
        id: 'mutual_understanding',
        text: 'Что особенного в том, как вы понимаете друг друга?',
        type: 'textarea',
        placeholder: 'Telepathy, понимание с полуслова, чувство настроения... (минимум 50 слов)',
        required: true
      },
      {
        id: 'friendship_traditions',
        text: 'Ваши дружеские традиции и ритуалы',
        type: 'textarea',
        placeholder: 'Регулярные встречи, способы празднования, особые даты... (минимум 60 слов)',
        required: true
      },
      {
        id: 'dream_adventures',
        text: 'О каких совместных приключениях мечтаете?',
        type: 'textarea',
        placeholder: 'Планы на будущее, места которые хотите посетить вместе... (минимум 50 слов)',
        required: true
      },
      {
        id: 'friendship_wisdom',
        text: 'Какие жизненные уроки дала вам эта дружба?',
        type: 'textarea',
        placeholder: 'Что поняли о дружбе, жизни, себе благодаря этому человеку... (минимум 60 слов)',
        required: true
      },
      {
        id: 'gratitude_friend',
        text: 'За что вы больше всего благодарны другу?',
        type: 'textarea',
        placeholder: 'Что он привнес в вашу жизнь, как сделал ее лучше... (минимум 70 слов)',
        required: true
      },
      {
        id: 'friendship_message',
        text: 'Что хотите сказать другу через эту книгу?',
        type: 'textarea',
        placeholder: 'Слова благодарности, любви, планы на будущее дружбы... (минимум 80 слов)',
        required: true
      },
      {
        id: 'friendship_photos',
        text: 'Загрузите фотографии с лучшими моментами дружбы',
        type: 'file',
        required: true
      }
    ]
  },
  {
    id: 'child',
    title: 'Детская книга',
    description: 'О вашем ребенке',
    icon: Heart,
    price: '3,490₽',
    questions: [
      {
        id: 'child_name',
        text: 'Как зовут вашего ребенка?',
        type: 'text',
        placeholder: 'Полное имя и домашние прозвища',
        required: true
      },
      {
        id: 'child_age',
        text: 'Сколько лет ребенку?',
        type: 'text',
        placeholder: '5 лет, 2 года 3 месяца...',
        required: true
      },
      {
        id: 'pregnancy_story',
        text: 'История ожидания малыша',
        type: 'textarea',
        placeholder: 'Беременность, первые шевеления, подготовка к рождению... (минимум 80 слов)',
        required: true
      },
      {
        id: 'birth_story',
        text: 'День рождения вашего чуда',
        type: 'textarea',
        placeholder: 'Роды, первая встреча, первые эмоции... (минимум 70 слов)',
        required: true
      },
      {
        id: 'first_moments',
        text: 'Первые дни дома с малышом',
        type: 'textarea',
        placeholder: 'Новые ощущения, привыкание, первые ночи... (минимум 60 слов)',
        required: true
      },
      {
        id: 'milestones',
        text: 'Важные достижения и первые разы',
        type: 'textarea',
        placeholder: 'Первая улыбка, слово, шаг, зубик... (минимум 80 слов)',
        required: true
      },
      {
        id: 'personality_traits',
        text: 'Характер и особенности ребенка',
        type: 'textarea',
        placeholder: 'Темперамент, привычки, что делает его уникальным... (минимум 70 слов)',
        required: true
      },
      {
        id: 'favorite_activities',
        text: 'Любимые игры и занятия',
        type: 'textarea',
        placeholder: 'Во что любит играть, чем увлекается, таланты... (минимум 60 слов)',
        required: true
      },
      {
        id: 'funny_sayings',
        text: 'Смешные слова и фразы ребенка',
        type: 'textarea',
        placeholder: 'Детские перлы, забавные высказывания, логика ребенка... (минимум 60 слов)',
        required: true
      },
      {
        id: 'bedtime_rituals',
        text: 'Ритуалы перед сном',
        type: 'textarea',
        placeholder: 'Любимые сказки, песенки, как укладываетесь спать... (минимум 50 слов)',
        required: true
      },
      {
        id: 'parent_child_moments',
        text: 'Особенные моменты с ребенком',
        type: 'textarea',
        placeholder: 'Трогательные ситуации, когда сердце переполняется любовью... (минимум 80 слов)',
        required: true
      },
      {
        id: 'child_dreams',
        text: 'Мечты и планы для ребенка',
        type: 'textarea',
        placeholder: 'Каким видите будущее, чего желаете в жизни... (минимум 60 слов)',
        required: true
      },
      {
        id: 'love_message',
        text: 'Послание любви вашему ребенку',
        type: 'textarea',
        placeholder: 'Что хотите, чтобы он знал о вашей любви... (минимум 80 слов)',
        required: true
      },
      {
        id: 'child_photos',
        text: 'Загрузите самые дорогие фотографии ребенка',
        type: 'file',
        required: true
      }
    ]
  },
  {
    id: 'travel',
    title: 'Книга путешествий',
    description: 'Ваши приключения',
    icon: Sparkles,
    price: '2,790₽',
    questions: [
      {
        id: 'travel_companion',
        text: 'С кем путешествовали?',
        type: 'text',
        placeholder: 'Один, с партнером, семьей, друзьями...',
        required: true
      },
      {
        id: 'destination',
        text: 'Куда ездили?',
        type: 'text',
        placeholder: 'Страны, города, регионы...',
        required: true
      },
      {
        id: 'travel_motivation',
        text: 'Что вдохновило на это путешествие?',
        type: 'textarea',
        placeholder: 'Мечта, случайность, особый повод... (минимум 50 слов)',
        required: true
      },
      {
        id: 'preparation',
        text: 'Как готовились к поездке?',
        type: 'textarea',
        placeholder: 'Планирование, сборы, ожидания... (минимум 60 слов)',
        required: true
      },
      {
        id: 'first_impressions',
        text: 'Первые впечатления от места',
        type: 'textarea',
        placeholder: 'Что увидели, почувствовали, услышали по прибытии... (минимум 70 слов)',
        required: true
      },
      {
        id: 'best_moments',
        text: 'Самые яркие моменты путешествия',
        type: 'textarea',
        placeholder: 'То, что запомнится навсегда... (минимум 80 слов)',
        required: true
      },
      {
        id: 'local_culture',
        text: 'Знакомство с местной культурой',
        type: 'textarea',
        placeholder: 'Традиции, еда, люди которые встретили... (минимум 70 слов)',
        required: true
      },
      {
        id: 'unexpected_adventures',
        text: 'Неожиданные приключения и сюрпризы',
        type: 'textarea',
        placeholder: 'То, что не планировали, но случилось... (минимум 60 слов)',
        required: true
      },
      {
        id: 'challenges',
        text: 'Трудности и как их преодолевали',
        type: 'textarea',
        placeholder: 'Проблемы в пути и как справлялись... (минимум 50 слов)',
        required: true
      },
      {
        id: 'personal_growth',
        text: 'Как путешествие изменило вас?',
        type: 'textarea',
        placeholder: 'Новые взгляды, открытия о себе и мире... (минимум 60 слов)',
        required: true
      },
      {
        id: 'travel_wisdom',
        text: 'Какие уроки дало это путешествие?',
        type: 'textarea',
        placeholder: 'Жизненная мудрость, полученная в дороге... (минимум 60 слов)',
        required: true
      },
      {
        id: 'future_travels',
        text: 'Планы на будущие путешествия',
        type: 'textarea',
        placeholder: 'Куда хотите поехать дальше и почему... (минимум 50 слов)',
        required: true
      },
      {
        id: 'travel_photos',
        text: 'Загрузите лучшие фотографии из путешествия',
        type: 'file',
        required: true
      }
    ]
  }
];

export default function CreateBook() {
  const router = useRouter();
  const { saveBook, setIsBookLoading } = useBook();
  
  const [selectedType, setSelectedType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const imageUpload = useImageUpload({
    required: true,
    maxImages: 8,
    maxTotalSize: 40 * 1024 * 1024 // 40MB общий лимит
  });

  const currentBookType = bookTypes.find(bt => bt.id === selectedType);
  const totalSteps = currentBookType ? currentBookType.questions.length + 2 : 2;

  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [imageUpload.imageState.hasImages, imageUpload.imageState.count, imageUpload.imageState.isValid]);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setAnswers({});
    imageUpload.clearImages();
    setCurrentStep(1);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getCurrentQuestion = (): Question | null => {
    if (!currentBookType || currentStep === 0 || currentStep >= totalSteps) return null;
    return currentBookType.questions[currentStep - 1];
  };

  const isStepComplete = (): boolean => {
    if (currentStep === 0) return selectedType !== '';
    
    const question = getCurrentQuestion();
    if (!question) return true;
    
    if (question.type === 'file') {
      const hasImages = imageUpload.imageState.hasImages;
      return !question.required || hasImages;
    } else {
      const answer = answers[question.id];
      return question.required ? !!answer && answer !== '' : true;
    }
  };

  const handleNext = async () => {
    const currentQuestion = getCurrentQuestion();
    const stepComplete = isStepComplete();

    if (currentStep === totalSteps - 2) {
      if (currentQuestion?.required && !stepComplete) {
        if (currentQuestion?.type === 'file') {
          const error = imageUpload.getImageValidationError();
          alert(error || 'Необходимо загрузить фотографии');
        } else {
          alert('Пожалуйста, заполните все обязательные поля');
        }
        return;
      }

      setIsGenerating(true);
      setIsBookLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000);
      
      try {
        let processedImages: Array<{
          name: string;
          base64: string;
          size: number;
          dimensions: { width: number; height: number };
          compressed?: boolean;
        }> = [];
        
        try {
          processedImages = imageUpload.getImagesForApi();
        } catch (apiError) {
          console.log('Image processing error:', apiError);
          processedImages = [];
        }
        
        const apiData = {
          bookType: selectedType,
          answers: answers,
          images: processedImages.length > 0 ? processedImages : []
        };
        
        const response = await fetch('/api/generate-book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.error || 'Ошибка при генерации книги'}`);
        }

        const result = await response.json();
        
        if (result.success) {
          saveBook(result.book);
          router.push('/book');
        } else {
          throw new Error(result.error || 'Неизвестная ошибка');
        }
      } catch (apiError) {
        if (apiError instanceof Error) {
          if (apiError.name === 'AbortError') {
            alert('Генерация большой книги заняла слишком много времени. Попробуйте еще раз или выберите меньше деталей.');
          } else {
            alert(`Ошибка: ${apiError.message}`);
          }
        } else {
          alert('Произошла неизвестная ошибка. Попробуйте еще раз.');
        }
      } finally {
        clearTimeout(timeoutId);
        setIsGenerating(false);
        setIsBookLoading(false);
      }
      
    } else if (currentStep < totalSteps - 2) {
      if (!stepComplete) {
        if (currentQuestion?.type === 'file') {
          const error = imageUpload.getImageValidationError();
          alert(error || 'Необходимо загрузить фотографии');
        } else {
          alert('Пожалуйста, заполните все обязательные поля');
        }
        return;
      }
      
      setCurrentStep(prev => prev + 1);
      setForceUpdate(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setForceUpdate(prev => prev + 1);
    }
  };

  const handleViewBook = () => {
    router.push('/book');
  };

  // Экран выбора типа книги
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <header className="container mx-auto px-4 py-6">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              VeloraBook
            </h1>
          </Link>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Создайте вашу персональную книгу
            </h1>
            <p className="text-xl text-gray-600">
              Выберите тип книги, которую хотите создать
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {bookTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <div
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl cursor-pointer transform hover:-translate-y-1 transition-all duration-200 border-2 border-transparent hover:border-purple-300"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {type.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{type.description}</p>
                    <div className="text-2xl font-bold text-purple-600 mb-4">
                      {type.price}
                    </div>
                    <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all">
                      Выбрать
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Экран генерации
  if (isGenerating) {
    const hasImages = imageUpload.imageState.hasImages;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            ИИ создает вашу объемную книгу...
          </h2>
          <p className="text-gray-600 mb-4">
            Генерируем полную персональную историю 4000-6000 слов
          </p>
          
          {hasImages && (
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Анализируем ваши фотографии</span>
              </div>
              <p className="text-xs text-gray-500">
                ИИ изучает {imageUpload.imageState.count} изображений для создания более персональной истории
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            Это может занять до {hasImages ? '240' : '180'} секунд для полной книги
          </p>
          
          <div className="mt-4 space-y-2 text-xs text-gray-400">
            <div>🧠 Анализируем 20+ детальных ответов</div>
            {hasImages && <div>📸 Обрабатываем изображения с помощью ИИ</div>}
            <div>✍️ Создаем объемную персональную историю</div>
            <div>📖 Форматируем книгу с множественными главами</div>
            <div>🎨 Финальная обработка и оформление</div>
          </div>
        </div>
      </div>
    );
  }

  // Финальный экран
  if (currentStep >= totalSteps) {
    const hasImages = imageUpload.imageState.hasImages;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ваша книга готова! 🎉
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Что включено в книгу:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <span>📝</span>
                  <span>Объемная персональная история 4000-6000 слов</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>📚</span>
                  <span>4-6 детально проработанных глав</span>
                </div>
                {hasImages && (
                  <div className="flex items-center justify-center space-x-2">
                    <span>📸</span>
                    <span>
                      {imageUpload.imageState.count} изображений проанализированы ИИ и включены в повествование
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center space-x-2">
                  <span>🎨</span>
                  <span>Красивое оформление с 3D-обложкой</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>⚡</span>
                  <span>Создано с помощью GPT-4 Turbo</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handleViewBook}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-semibold"
              >
                🎯 Просмотреть книгу
              </button>
              <button className="w-full border border-purple-500 text-purple-500 py-3 px-6 rounded-lg hover:bg-purple-50 transition-all">
                📦 Заказать печатную версию
              </button>
              <Link href="/">
                <button className="w-full text-gray-500 py-2 px-4 rounded-lg hover:text-gray-700 transition-all">
                  ← Создать еще одну книгу
                </button>
              </Link>
            </div>
            
            {hasImages && (
              <div className="mt-6 text-xs text-gray-500">
                💡 Совет: Ваши изображения были автоматически обработаны для интеграции в полноценную книгу
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const question = getCurrentQuestion();
  if (!question || !currentBookType) return null;

  const stepComplete = isStepComplete();
  const buttonDisabled = !stepComplete;

  // Экран вопроса
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            VeloraBook
          </h1>
        </Link>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Вопрос {currentStep} из {totalSteps - 2}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentStep / (totalSteps - 2)) * 100)}% завершено
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (totalSteps - 2)) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {question.text}
          </h2>

          {question.type === 'text' && (
            <input
              type="text"
              placeholder={question.placeholder}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            />
          )}

          {question.type === 'textarea' && (
            <textarea
              placeholder={question.placeholder}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            />
          )}

          {question.type === 'file' && (
            <div>
              <ImageUploader
                maxFiles={8}
                maxSizeBytes={5 * 1024 * 1024}
                onImagesChange={imageUpload.handleImagesChange}
                initialImages={imageUpload.imageState.images}
                disabled={isGenerating}
              />
              
              {imageUpload.imageState.hasImages && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ✓ Загружено {imageUpload.imageState.count} изображений
                    ({Math.round(imageUpload.imageState.totalSize / (1024 * 1024) * 100) / 100} MB)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    ИИ проанализирует ваши фотографии и включит их описания в книгу
                  </p>
                </div>
              )}
              
              {imageUpload.getImageValidationError() && (
                <div className="mt-3 text-red-600 text-sm">
                  {imageUpload.getImageValidationError()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </button>

          <button
            key={`next-button-${forceUpdate}-${stepComplete}`}
            onClick={handleNext}
            disabled={buttonDisabled}
            className={`flex items-center px-6 py-3 rounded-lg transition-all font-semibold ${
              buttonDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
            }`}
          >
            {currentStep === totalSteps - 2 ? 'Создать книгу' : 'Далее'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}