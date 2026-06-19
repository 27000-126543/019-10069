const REFERENCE_ANNOTATIONS = {
  'case-1': {
    'c1m1': { stance: 'pro-west', emotion: 1, entities: ['美国政府', '跨国企业'], audience: ['商界/投资者', '西方公众'], note: '标准的西方主流媒体报道，客观陈述事实但框架隐含"国家安全"正当性' },
    'c1m2': { stance: 'pro-china', emotion: 2, entities: ['中国政府', '美国政府'], audience: ['中国公众', '发展中国家公众'], note: '中方官方回应，用词明确立场鲜明但情绪克制' },
    'c1m3': { stance: 'pro-china', emotion: 4, entities: ['美国政府', '中国政府'], audience: ['青年群体', '社会活动人士'], note: '高情绪社交帖，强调"经济战争"叙事，大量感叹号和大写字母' },
    'c1m4': { stance: 'neutral', emotion: 2, entities: ['欧盟', '跨国企业'], audience: ['商界/投资者', '国际政策圈'], note: '欧洲视角平衡报道，呈现两难处境不明显站队' },
    'c1m5': { stance: 'pro-west', emotion: 4, entities: ['中国政府', '美国政府'], audience: ['西方公众', '青年群体'], note: '典型Reddit反华评论，假设IP盗窃为既定事实，明显情绪偏见' },
    'c1m6': { stance: 'pro-china', emotion: 4, entities: ['美国政府', '中国政府'], audience: ['中国公众', '青年群体'], note: '微博高互动内容，强烈民族主义情绪，"霸凌"叙事框架' },
    'c1m7': { stance: 'neutral', emotion: 1, entities: ['跨国企业', '科研机构'], audience: ['学术界', '商界/投资者'], note: '行业分析报告，引述专家观点，相对客观中立' },
    'c1m8': { stance: 'anti-establishment', emotion: 3, entities: ['中国政府', '美国政府', '普通民众'], audience: ['社会活动人士', '普通民众'], note: '反建制视角，批判双方政治精英，同情普通民众' }
  },
  'case-2': {
    'c2m1': { stance: 'pro-west', emotion: 2, entities: ['中国政府', '军事力量'], audience: ['西方公众', '军事/安全圈'], note: '太平洋防务视角，聚焦中国扩张叙事' },
    'c2m2': { stance: 'neutral', emotion: 1, entities: ['东盟', '中国政府', '美国政府'], audience: ['国际政策圈', '商界/投资者'], note: '东盟观察者，呈现各国平衡策略' },
    'c2m3': { stance: 'pro-china', emotion: 4, entities: ['联合国', '中国政府'], audience: ['中国公众', '青年群体'], note: '强烈亲华帖文，贬低国际仲裁合法性' },
    'c2m4': { stance: 'pro-china', emotion: 3, entities: ['中国政府', '西方媒体'], audience: ['中国公众', '发展中国家公众'], note: '环球时报英文版，典型反西方宣传框架' },
    'c2m5': { stance: 'pro-developing', emotion: 3, entities: ['中国政府', '普通民众'], audience: ['东南亚民众', '发展中国家公众'], note: '越南渔民第一人称叙述，受影响者真实声音' },
    'c2m6': { stance: 'neutral', emotion: 1, entities: ['军事力量', '媒体机构'], audience: ['学术界', '军事/安全圈'], note: '长线程分析，承诺基于卫星数据客观对比' },
    'c2m7': { stance: 'neutral', emotion: 1, entities: ['中国政府', '东盟'], audience: ['国际政策圈', '西方公众'], note: '路透社平衡报道，同时呈现双方说法' },
    'c2m8': { stance: 'pro-developing', emotion: 3, entities: ['中国政府', '美国政府', '普通民众'], audience: ['东南亚民众', '发展中国家公众'], note: '关注小国受害者视角，批评大国博弈' }
  },
  'case-3': {
    'c3m1': { stance: 'pro-west', emotion: 2, entities: ['联合国', '中国政府'], audience: ['西方公众', '国际政策圈'], note: '西方气候媒体，框架隐含对中印的批评' },
    'c3m2': { stance: 'pro-developing', emotion: 5, entities: ['美国政府', '发展中国家联盟'], audience: ['社会活动人士', '青年群体'], note: '极端情绪气候正义帖，大量大写和愤怒表情' },
    'c3m3': { stance: 'pro-developing', emotion: 2, entities: ['发展中国家联盟', '联合国'], audience: ['发展中国家公众', '国际政策圈'], note: '发展中国家统一立场呈现，强调资金需求' },
    'c3m4': { stance: 'pro-west', emotion: 4, entities: ['中国政府'], audience: ['西方公众', '青年群体'], note: '强烈反华评论，忽略历史排放责任' },
    'c3m5': { stance: 'pro-developing', emotion: 2, entities: ['跨国企业', '发展中国家联盟'], audience: ['商界/投资者', '学术界'], note: '绿色金融分析，客观呈现资金不足问题' },
    'c3m6': { stance: 'anti-establishment', emotion: 4, entities: ['联合国'], audience: ['社会活动人士', '青年群体'], note: '虚无主义反建制帖，批评气候谈判作秀' },
    'c3m7': { stance: 'pro-developing', emotion: 3, entities: ['普通民众', '发展中国家联盟'], audience: ['发展中国家公众', '社会活动人士'], note: '孟加拉国民众第一人称，气候正义视角' },
    'c3m8': { stance: 'neutral', emotion: 1, entities: ['跨国企业', '发展中国家联盟'], audience: ['学术界', '商界/投资者'], note: '深入数据驱动分析，贷款vs赠款问题' }
  },
  'case-4': {
    'c4m1': { stance: 'pro-west', emotion: 2, entities: ['中国政府', '人权组织'], audience: ['西方公众', '社会活动人士'], note: '人权组织报告，有卫星和证人证据支撑' },
    'c4m2': { stance: 'pro-china', emotion: 2, entities: ['中国政府'], audience: ['中国公众', '发展中国家公众'], note: '中国官方媒体报道，呈现"职业培训"叙事' },
    'c4m3': { stance: 'pro-west', emotion: 5, entities: ['中国政府', '人权组织'], audience: ['社会活动人士', '青年群体'], note: '极端情绪人权帖，种族灭绝指控，大量表情符号' },
    'c4m4': { stance: 'pro-china', emotion: 3, entities: ['中国政府', '西方媒体'], audience: ['中国公众', '发展中国家公众'], note: '新疆本地人称"未见集中营"，与伊拉克大规模杀伤性武器类比' },
    'c4m5': { stance: 'neutral', emotion: 1, entities: ['媒体机构', '人权组织'], audience: ['学术界', '西方公众'], note: '路透事实核查，纠正假视频但不否定整体指控' },
    'c4m6': { stance: 'pro-china', emotion: 3, entities: ['西方媒体', '人权组织'], audience: ['中国公众', '发展中国家公众'], note: '利用假视频事件推广"西方造谣"叙事' },
    'c4m7': { stance: 'pro-west', emotion: 3, entities: ['中国政府', '人权组织'], audience: ['西方公众', '社会活动人士'], note: '反驳单一假视频否定论，强调多重证据链' },
    'c4m8': { stance: 'neutral', emotion: 2, entities: ['联合国', '中国政府', '人权组织'], audience: ['国际政策圈', '学术界'], note: 'UN人权审议僵局呈现，各方立场客观报道' }
  }
};

const CASES = [
  {
    id: 'case-1',
    title: '某国涉华芯片制裁报道分析',
    desc: '分析境外主流媒体与社交平台对芯片出口管制事件的叙事框架差异，练习识别信息源立场与情绪操控手法。',
    category: '科技博弈',
    difficulty: '初级',
    tags: ['科技', '贸易', '制裁'],
    materials: [
      {
        id: 'c1m1',
        type: 'report',
        source: 'GlobalTech Review',
        timestamp: '2024-10-12 09:00',
        title: 'Washington Expands Chip Export Curbs to 37 Chinese Entities',
        content: 'The Commerce Department announced new export controls targeting 37 Chinese companies, restricting access to advanced semiconductor manufacturing equipment. Officials stated the measures aim to "prevent military-civil fusion" and protect national security.',
        evidenceReliability: 5,
        sourceTier: 'A'
      },
      {
        id: 'c1m2',
        type: 'report',
        source: 'Asia Daily Brief',
        timestamp: '2024-10-12 14:30',
        title: 'Beijing Condemns Latest US Chip Restrictions as "Tech Suppression"',
        content: 'China\'s Ministry of Commerce issued a sharp response calling the new controls "a violation of free trade principles" and "an attempt to maintain technological hegemony." A spokesperson urged the international community to oppose such "unilateral bullying."',
        evidenceReliability: 4,
        sourceTier: 'B'
      },
      {
        id: 'c1m3',
        type: 'social',
        source: 'X (Twitter) @TechPolicyWatch',
        timestamp: '2024-10-12 16:45',
        title: '',
        content: 'BREAKING: US just blacklisted 37 more Chinese firms. This is economic warfare disguised as national security. When will the world wake up? 🚨🚨🚨 #ChipWar #TechDecoupling',
        likes: 12400,
        reposts: 3800,
        evidenceReliability: 2,
        sourceTier: 'C'
      },
      {
        id: 'c1m4',
        type: 'report',
        source: 'European Tech Monitor',
        timestamp: '2024-10-13 10:00',
        title: 'EU Caught in Crossfire as US-China Chip War Escalates',
        content: 'European semiconductor equipment makers face growing pressure as US export controls create compliance uncertainty. ASML and other firms reported "complex regulatory environments" but stopped short of criticizing US policy directly.',
        evidenceReliability: 4,
        sourceTier: 'A'
      },
      {
        id: 'c1m5',
        type: 'comment',
        source: 'Reddit r/worldnews',
        timestamp: '2024-10-13 12:20',
        title: '',
        content: 'China has been stealing IP for decades and now they\'re crying about "fair trade"? Give me a break. These restrictions are long overdue. You can\'t cheat your way to the top and then complain when someone closes the door.',
        upvotes: 890,
        replies: 234,
        evidenceReliability: 1,
        sourceTier: 'D'
      },
      {
        id: 'c1m6',
        type: 'social',
        source: 'Weibo (reposted on X)',
        timestamp: '2024-10-13 18:00',
        title: '',
        content: '美国又搞芯片禁令，37家中国企业被拉黑。这不是国家安全，这是赤裸裸的技术霸凌！中国科技不会被吓倒，只会越挫越勇！💪 #芯片战争 #自主创新',
        likes: 45000,
        reposts: 12000,
        evidenceReliability: 2,
        sourceTier: 'C'
      },
      {
        id: 'c1m7',
        type: 'report',
        source: 'Semiconductor Industry Analysis',
        timestamp: '2024-10-14 08:30',
        title: 'New US Controls May Slow but Won\'t Stop China\'s Chip Ambitions',
        content: 'Industry analysts note that while the expanded controls target key chokepoints in semiconductor manufacturing, China has been developing domestic alternatives. "The effectiveness of these measures diminishes over time as China builds its own supply chain," said Dr. Sarah Chen of the Tech Policy Institute.',
        evidenceReliability: 5,
        sourceTier: 'A'
      },
      {
        id: 'c1m8',
        type: 'comment',
        source: 'YouTube comment section',
        timestamp: '2024-10-14 20:15',
        title: '',
        content: 'Both sides are playing the victim while ordinary people pay the price. These tech wars just make everything more expensive for everyone. Wake up people, this isn\'t about security or fairness — it\'s about power and money on BOTH sides.',
        upvotes: 1200,
        replies: 567,
        evidenceReliability: 2,
        sourceTier: 'D'
      }
    ]
  },
  {
    id: 'case-2',
    title: '南海争端国际媒体报道对比',
    desc: '对比西方媒体、东南亚媒体与社交舆论在南海仲裁案周年报道中的叙事差异，练习识别框架偏移与信息筛选。',
    category: '领土争端',
    difficulty: '中级',
    tags: ['南海', '国际法', '军事'],
    materials: [
      {
        id: 'c2m1',
        type: 'report',
        source: 'Pacific Defense Weekly',
        timestamp: '2024-07-12 07:00',
        title: 'South China Sea: 8 Years After the Hague Ruling, China Continues Expansion',
        content: 'Eight years after the Permanent Court of Arbitration ruled against China\'s historic claims in the South China Sea, Beijing has accelerated its island-building program. Satellite imagery reveals new military installations on Mischief Reef and Fiery Cross Reef, despite repeated international protests.',
        evidenceReliability: 5,
        sourceTier: 'A'
      },
      {
        id: 'c2m2',
        type: 'report',
        source: 'ASEAN Observer',
        timestamp: '2024-07-12 10:30',
        title: 'Southeast Asian Nations Seek Balance Amid South China Sea Tensions',
        content: 'ASEAN member states find themselves navigating between competing pressures. While several nations have maritime disputes with China, economic ties remain strong. The Philippines has taken a more assertive stance, while Cambodia and Laos prefer quiet diplomacy.',
        evidenceReliability: 4,
        sourceTier: 'A'
      },
      {
        id: 'c2m3',
        type: 'social',
        source: 'X (Twitter) @FreedomOfSeas',
        timestamp: '2024-07-12 14:00',
        title: '',
        content: 'The Hague ruling was a JOKE — a Western-orchestrated kangaroo court with zero enforcement power. China was right to ignore it. 8 years later, the South China Sea is more stable than ever under Chinese stewardship. 🇨🇳 #SouthChinaSea',
        likes: 8200,
        reposts: 2100,
        evidenceReliability: 2,
        sourceTier: 'C'
      },
      {
        id: 'c2m4',
        type: 'report',
        source: 'Beijing Global Times (English)',
        timestamp: '2024-07-12 16:00',
        title: 'Western Hypocrisy on Full Display as South China Sea "Anniversary" Weaponized',
        content: 'Western media outlets are using the so-called anniversary of the arbitration ruling to launch another round of anti-China propaganda. The ruling, which China does not recognize, was based on a unilateral filing by the Philippines and lacks any binding enforcement mechanism.',
        evidenceReliability: 3,
        sourceTier: 'B'
      },
      {
        id: 'c2m5',
        type: 'comment',
        source: 'Facebook discussion group',
        timestamp: '2024-07-13 09:45',
        title: '',
        content: 'As a Vietnamese fisherman, I don\'t care about courts or politicians. What I care about is that Chinese coast guard ships keep harassing our boats. This is our waters, our livelihood. Where is the international community when we actually need help?',
        upvotes: 3400,
        replies: 890,
        evidenceReliability: 4,
        sourceTier: 'C'
      },
      {
        id: 'c2m6',
        type: 'social',
        source: 'X (Twitter) @NavalAnalysis',
        timestamp: '2024-07-13 15:30',
        title: '',
        content: 'THREAD: Let\'s compare actual satellite data vs media narratives on South China Sea militarization. The reality is far more nuanced than either side portrays... 🧵 1/7',
        likes: 5600,
        reposts: 4200,
        evidenceReliability: 4,
        sourceTier: 'B'
      },
      {
        id: 'c2m7',
        type: 'report',
        source: 'Reuters',
        timestamp: '2024-07-14 08:00',
        title: 'Philippines, China Trade Accusations After Latest South China Sea Confrontation',
        content: 'The Philippines and China exchanged diplomatic protests following a weekend incident near Second Thomas Shoal. Manila accused Chinese vessels of "dangerous maneuvers" while Beijing claimed Philippine ships "illegally intruded" into Chinese waters. Both sides released video evidence supporting their accounts.',
        evidenceReliability: 5,
        sourceTier: 'A'
      },
      {
        id: 'c2m8',
        type: 'comment',
        source: 'Reddit r/geopolitics',
        timestamp: '2024-07-14 22:10',
        title: '',
        content: 'Everyone talks about China vs the US but ignores that the real victims are the Southeast Asian nations who just want to fish and trade in peace. The superpower rivalry is destroying livelihoods across the region.',
        upvotes: 2100,
        replies: 445,
        evidenceReliability: 3,
        sourceTier: 'C'
      }
    ]
  },
  {
    id: 'case-3',
    title: '气候变化议题中的叙事博弈',
    desc: '分析围绕COP会议期间境外媒体与社交平台在碳排放责任、发展中国家立场等议题上的叙事框架差异。',
    category: '气候治理',
    difficulty: '中级',
    tags: ['气候', '发展', '多边博弈'],
    materials: [
      {
        id: 'c3m1',
        type: 'report',
        source: 'Western Climate Network',
        timestamp: '2024-11-11 08:00',
        title: 'COP29 Opens as China and India Resist Binding Emission Targets',
        content: 'The latest climate summit opened amid tensions as major developing economies pushed back against proposed binding emission cuts. Western delegates argued that all major emitters must share responsibility, while Chinese and Indian representatives emphasized "common but differentiated responsibilities."',
        evidenceReliability: 4,
        sourceTier: 'A'
      },
      {
        id: 'c3m2',
        type: 'social',
        source: 'X (Twitter) @ClimateJusticeNow',
        timestamp: '2024-11-11 14:30',
        title: '',
        content: 'The US polluted the planet for 150 years and now wants developing nations to sacrifice their growth to "save" it? HYPOCRISY. The Global South didn\'t create this crisis but we\'re expected to pay the price. 🤬 #COP29 #ClimateJustice',
        likes: 28000,
        reposts: 9500,
        evidenceReliability: 3,
        sourceTier: 'C'
      },
      {
        id: 'c3m3',
        type: 'report',
        source: 'Development World Report',
        timestamp: '2024-11-12 09:00',
        title: 'Developing Nations Demand Climate Finance, Not Lectures',
        content: 'A coalition of 134 developing nations presented a unified demand for $1 trillion in annual climate finance. The group argued that developed countries have failed to meet previous commitments and that new emission targets are meaningless without financial support for green transitions.',
        evidenceReliability: 5,
        sourceTier: 'A'
      },
      {
        id: 'c3m4',
        type: 'comment',
        source: 'YouTube comment section',
        timestamp: '2024-11-12 18:00',
        title: '',
        content: 'China is the world\'s biggest emitter BY FAR and they\'re hiding behind "developing nation" status. They build more coal plants than the rest of the world combined. Enough with the excuses — if the planet is at stake, EVERYONE needs to act NOW.',
        upvotes: 4500,
        replies: 1200,
        evidenceReliability: 2,
        sourceTier: 'D'
      },
      {
        id: 'c3m5',
        type: 'report',
        source: 'Green Finance Daily',
        timestamp: '2024-11-13 07:30',
        title: 'Climate Finance Pledges Fall Short Again as Rich Nations Stall',
        content: 'Despite mounting pressure, developed nations have only pledged $100 billion annually — a fraction of what developing countries say is needed. Analysts note that even existing pledges remain largely unfulfilled, with disbursement rates below 30%.',
        evidenceReliability: 5,
        sourceTier: 'A'
      },
      {
        id: 'c3m6',
        type: 'social',
        source: 'X (Twitter) @EcoRealist',
        timestamp: '2024-11-13 16:00',
        title: '',
        content: 'Climate negotiations are just theater. Governments make grand promises, activists cheer, and NOTHING changes. Emissions keep rising. Wake me up when someone actually does something meaningful instead of flying private jets to climate conferences. ✈️🌍 #COP29',
        likes: 15000,
        reposts: 6200,
        evidenceReliability: 2,
        sourceTier: 'C'
      },
      {
        id: 'c3m7',
        type: 'comment',
        source: 'Reddit r/environment',
        timestamp: '2024-11-14 11:30',
        title: '',
        content: 'As someone from Bangladesh, I find it offensive when people from countries with 10x our per-capita emissions lecture us about responsibility. We\'re literally sinking while they debate semantics. The injustice is staggering.',
        upvotes: 6700,
        replies: 1800,
        evidenceReliability: 4,
        sourceTier: 'C'
      },
      {
        id: 'c3m8',
        type: 'report',
        source: 'Carbon Brief Analysis',
        timestamp: '2024-11-14 14:00',
        title: 'Who Really Pays? Mapping the Climate Finance Flow Between Nations',
        content: 'A detailed analysis of climate finance flows reveals that a significant portion of "climate aid" from developed nations comes in the form of loans rather than grants, increasing debt burdens for recipient countries. Meanwhile, historical emissions data shows the top 10 wealthiest nations responsible for over 60% of cumulative CO2 since 1850.',
        evidenceReliability: 5,
        sourceTier: 'A'
      }
    ]
  },
  {
    id: 'case-4',
    title: '涉疆人权议题的舆论传播分析',
    desc: '观察境外媒体、人权组织与社交平台在涉疆议题上的叙事建构过程，练习识别信息源层级与证据链完整性。',
    category: '人权议题',
    difficulty: '高级',
    tags: ['人权', '证据分析', '叙事建构'],
    materials: [
      {
        id: 'c4m1',
        type: 'report',
        source: 'Human Rights Watch Briefing',
        timestamp: '2024-06-01 08:00',
        title: 'New Evidence Reveals Systematic Detention in Xinjiang "Vocational Centers"',
        content: 'HRW released a briefing citing satellite imagery analysis and testimony from 12 former detainees. The report claims that facilities described by Chinese authorities as "vocational training centers" show characteristics consistent with detention infrastructure, including watchtowers and perimeter fencing.',
        evidenceReliability: 5,
        sourceTier: 'A'
      },
      {
        id: 'c4m2',
        type: 'report',
        source: 'China Daily (English)',
        timestamp: '2024-06-02 09:00',
        title: 'Xinjiang Vocational Training Program Successfully Combats Extremism',
        content: 'Chinese authorities highlighted the success of vocational training programs in Xinjiang, noting that participants have gained valuable employment skills and that the region has not experienced a terrorist incident in over seven years. Officials emphasized that the programs are voluntary and focused on poverty alleviation.',
        evidenceReliability: 3,
        sourceTier: 'B'
      },
      {
        id: 'c4m3',
        type: 'social',
        source: 'X (Twitter) @UyghurRights',
        timestamp: '2024-06-02 16:00',
        title: '',
        content: 'CHINA IS COMMITTING GENOCIDE AND THE WORLD IS SILENT. Millions of Uyghurs locked in concentration camps. Families torn apart. Children orphaned. How many more have to suffer before the "international community" acts?! 💔✊ #SaveUyghurs #NeverAgain',
        likes: 45000,
        reposts: 18000,
        evidenceReliability: 2,
        sourceTier: 'C'
      },
      {
        id: 'c4m4',
        type: 'comment',
        source: 'YouTube comment section',
        timestamp: '2024-06-03 10:30',
        title: '',
        content: 'I\'m from Xinjiang and I\'ve never seen any "concentration camps." These Western NGOs fabricate stories to justify sanctions and regime change. They did the same thing with Iraq WMDs. When will people learn?',
        upvotes: 2300,
        replies: 890,
        evidenceReliability: 3,
        sourceTier: 'C'
      },
      {
        id: 'c4m5',
        type: 'report',
        source: 'Reuters Fact Check',
        timestamp: '2024-06-04 08:00',
        title: 'Viral Xinjiang Video Misidentified, But Core Allegations Persist',
        content: 'A widely shared video purporting to show Uyghur detainees was found to be footage from an Indonesian prison filmed in 2019. However, Reuters noted that the misidentification of this particular video does not invalidate other documented allegations regarding Xinjiang. The original video had been viewed over 5 million times before correction.',
        evidenceReliability: 5,
        sourceTier: 'A'
      },
      {
        id: 'c4m6',
        type: 'social',
        source: 'X (Twitter) @ChinaInsider',
        timestamp: '2024-06-04 20:00',
        title: '',
        content: 'So ANOTHER anti-China story falls apart under scrutiny. First the "forced labor" cotton claims, now fake detention videos. When will Western media hold themselves accountable for spreading disinformation about China? The pattern is clear. 🧐 #MediaBias',
        likes: 12000,
        reposts: 5600,
        evidenceReliability: 2,
        sourceTier: 'C'
      },
      {
        id: 'c4m7',
        type: 'comment',
        source: 'Reddit r/worldnews',
        timestamp: '2024-06-05 14:00',
        title: '',
        content: 'One misidentified video doesn\'t erase years of documented evidence. The satellite imagery, the leaked documents, the consistent testimonies — these aren\'t fabricated. Dismissing all evidence because of one error is exactly what bad-faith actors want.',
        upvotes: 5600,
        replies: 2100,
        evidenceReliability: 4,
        sourceTier: 'C'
      },
      {
        id: 'c4m8',
        type: 'report',
        source: 'Diplomatic Courier',
        timestamp: '2024-06-06 07:30',
        title: 'UN Human Rights Review Deadlocked on Xinjiang Assessment',
        content: 'A UN Human Rights Council review of the Xinjiang situation ended without consensus. Western nations pushed for a formal investigation while a group of developing countries — many recipients of Chinese investment — signed a joint letter praising China\'s counter-extremism efforts. The Office of the High Commissioner\'s earlier assessment noted "serious human rights concerns" but stopped short of using the term "genocide."',
        evidenceReliability: 5,
        sourceTier: 'A'
      }
    ]
  }
];

const STANCE_OPTIONS = [
  { value: 'pro-china', label: '亲华/支持中国立场', color: '#e74c3c' },
  { value: 'pro-west', label: '亲西方/对华批评', color: '#3498db' },
  { value: 'neutral', label: '中立/平衡报道', color: '#95a5a6' },
  { value: 'anti-establishment', label: '反建制/质疑官方', color: '#9b59b6' },
  { value: 'pro-developing', label: '亲发展中国家立场', color: '#2ecc71' },
  { value: 'ambiguous', label: '模糊/难以判断', color: '#f39c12' }
];

const EMOTION_OPTIONS = [
  { value: 1, label: '冷静客观', emoji: '😐' },
  { value: 2, label: '轻微情绪', emoji: '🤔' },
  { value: 3, label: '中等情绪', emoji: '😤' },
  { value: 4, label: '强烈情绪', emoji: '😡' },
  { value: 5, label: '极端煽动', emoji: '🤯' }
];

const ENTITY_OPTIONS = [
  '中国政府', '美国政府', '欧盟', '东盟', '联合国',
  '跨国企业', '人权组织', '媒体机构', '普通民众',
  '军事力量', '科研机构', '发展中国家联盟'
];

const AUDIENCE_OPTIONS = [
  '西方公众', '中国公众', '发展中国家公众', '国际政策圈',
  '商界/投资者', '学术界', '社会活动人士', '军事/安全圈',
  '青年群体', '东南亚民众'
];

const TYPE_LABELS = {
  report: { label: '媒体报道', icon: '📰' },
  social: { label: '社交帖文', icon: '💬' },
  comment: { label: '评论片段', icon: '🗣️' }
};

const SOURCE_TIERS = {
  'A': { label: '权威信源（主流媒体/官方机构/学术报告）', score: 5 },
  'B': { label: '次级信源（国家媒体/行业分析）', score: 4 },
  'C': { label: '社交帖文/专业博主', score: 3 },
  'D': { label: '匿名评论/无来源内容', score: 1 }
};
