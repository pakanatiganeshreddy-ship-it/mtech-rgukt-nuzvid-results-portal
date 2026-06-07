--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: pdf_uploads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pdf_uploads (id, filename, uploaded_at, records_extracted, records_inserted, students_created) FROM stdin;
4	MTech_1st_Year_2024-Batch-ECE_Sem-1_Regular_examination_results_for_June_2025.pdf	2026-06-06 16:37:18.664864+00	48	48	6
\.


--
-- Data for Name: results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.results (id, student_id, semester, subject_code, subject_name, credits, grade, grade_point, created_at) FROM stdin;
68	NM2403CP01	1	24CSP1103	Communications and Signal processing Digital Communications	3	A	9	2026-06-06 16:37:18.425233+00
69	NM2403CP02	1	24CSP1103	Communications and Signal processing Digital Communications	3	D	6	2026-06-06 16:37:18.433597+00
70	NM2403CP03	1	24CSP1103	Communications and Signal processing Digital Communications	3	B	8	2026-06-06 16:37:18.44011+00
71	NM2403CP04	1	24CSP1103	Communications and Signal processing Digital Communications	3	A	9	2026-06-06 16:37:18.448257+00
72	NM2403CP05	1	24CSP1103	Communications and Signal processing Digital Communications	3	A	9	2026-06-06 16:37:18.455261+00
73	NM2403CP06	1	24CSP1103	Communications and Signal processing Digital Communications	3	B	8	2026-06-06 16:37:18.46407+00
74	NM2403CP01	1	24CSP1101	Communications and Signal processing Probability and Random Processes	3	EX	10	2026-06-06 16:37:18.469178+00
75	NM2403CP02	1	24CSP1101	Communications and Signal processing Probability and Random Processes	3	EX	10	2026-06-06 16:37:18.474031+00
76	NM2403CP03	1	24CSP1101	Communications and Signal processing Probability and Random Processes	3	EX	10	2026-06-06 16:37:18.479091+00
77	NM2403CP04	1	24CSP1101	Communications and Signal processing Probability and Random Processes	3	A	9	2026-06-06 16:37:18.484445+00
78	NM2403CP05	1	24CSP1101	Communications and Signal processing Probability and Random Processes	3	EX	10	2026-06-06 16:37:18.489656+00
79	NM2403CP06	1	24CSP1101	Communications and Signal processing Probability and Random Processes	3	A	9	2026-06-06 16:37:18.494543+00
80	NM2403CP01	1	24CSP1102	Communications and Signal processing Applied Linear Algebra	3	EX	10	2026-06-06 16:37:18.499759+00
81	NM2403CP02	1	24CSP1102	Communications and Signal processing Applied Linear Algebra	3	A	9	2026-06-06 16:37:18.504875+00
82	NM2403CP03	1	24CSP1102	Communications and Signal processing Applied Linear Algebra	3	EX	10	2026-06-06 16:37:18.509205+00
83	NM2403CP04	1	24CSP1102	Communications and Signal processing Applied Linear Algebra	3	A	9	2026-06-06 16:37:18.513434+00
84	NM2403CP05	1	24CSP1102	Communications and Signal processing Applied Linear Algebra	3	A	9	2026-06-06 16:37:18.519207+00
85	NM2403CP06	1	24CSP1102	Communications and Signal processing Applied Linear Algebra	3	A	9	2026-06-06 16:37:18.528195+00
86	NM2403CP01	1	24CSP1171	Communications and Signal processing Research Methodologies & IPR	2	EX	10	2026-06-06 16:37:18.532362+00
87	NM2403CP02	1	24CSP1171	Communications and Signal processing Research Methodologies & IPR	2	B	8	2026-06-06 16:37:18.53632+00
88	NM2403CP03	1	24CSP1171	Communications and Signal processing Research Methodologies & IPR	2	EX	10	2026-06-06 16:37:18.541449+00
89	NM2403CP04	1	24CSP1171	Communications and Signal processing Research Methodologies & IPR	2	A	9	2026-06-06 16:37:18.545797+00
90	NM2403CP05	1	24CSP1171	Communications and Signal processing Research Methodologies & IPR	2	A	9	2026-06-06 16:37:18.550096+00
91	NM2403CP06	1	24CSP1171	Communications and Signal processing Research Methodologies & IPR	2	B	8	2026-06-06 16:37:18.554064+00
92	NM2403CP01	1	24CSP1146	Communications and Signal processing Machine Learning	3	B	8	2026-06-06 16:37:18.558828+00
93	NM2403CP02	1	24CSP1146	Communications and Signal processing Machine Learning	3	D	6	2026-06-06 16:37:18.562981+00
94	NM2403CP03	1	24CSP1146	Communications and Signal processing Machine Learning	3	D	6	2026-06-06 16:37:18.56689+00
95	NM2403CP04	1	24CSP1146	Communications and Signal processing Machine Learning	3	B	8	2026-06-06 16:37:18.571268+00
96	NM2403CP05	1	24CSP1146	Communications and Signal processing Machine Learning	3	C	7	2026-06-06 16:37:18.575953+00
97	NM2403CP06	1	24CSP1146	Communications and Signal processing Machine Learning	3	B	8	2026-06-06 16:37:18.579629+00
98	NM2403CP01	1	24CSP1104	Communications and Signal processing Digital Signal Processing	3	A	9	2026-06-06 16:37:18.582829+00
99	NM2403CP02	1	24CSP1104	Communications and Signal processing Digital Signal Processing	3	C	7	2026-06-06 16:37:18.591158+00
100	NM2403CP03	1	24CSP1104	Communications and Signal processing Digital Signal Processing	3	A	9	2026-06-06 16:37:18.595349+00
101	NM2403CP04	1	24CSP1104	Communications and Signal processing Digital Signal Processing	3	A	9	2026-06-06 16:37:18.598877+00
102	NM2403CP05	1	24CSP1104	Communications and Signal processing Digital Signal Processing	3	B	8	2026-06-06 16:37:18.602744+00
103	NM2403CP06	1	24CSP1104	Communications and Signal processing Digital Signal Processing	3	B	8	2026-06-06 16:37:18.606484+00
104	NM2403CP01	1	24CSP1181	Communications and Signal processing Computational Laboratory	1.5	A	9	2026-06-06 16:37:18.611444+00
105	NM2403CP02	1	24CSP1181	Communications and Signal processing Computational Laboratory	1.5	A	9	2026-06-06 16:37:18.614852+00
106	NM2403CP03	1	24CSP1181	Communications and Signal processing Computational Laboratory	1.5	A	9	2026-06-06 16:37:18.619234+00
107	NM2403CP04	1	24CSP1181	Communications and Signal processing Computational Laboratory	1.5	A	9	2026-06-06 16:37:18.623431+00
108	NM2403CP05	1	24CSP1181	Communications and Signal processing Computational Laboratory	1.5	A	9	2026-06-06 16:37:18.628348+00
109	NM2403CP06	1	24CSP1181	Communications and Signal processing Computational Laboratory	1.5	A	9	2026-06-06 16:37:18.632347+00
110	NM2403CP01	1	24CSP1172	Communications and Signal processing Audit Course-1	0	P	0	2026-06-06 16:37:18.637006+00
111	NM2403CP02	1	24CSP1172	Communications and Signal processing Audit Course-1	0	P	0	2026-06-06 16:37:18.640839+00
112	NM2403CP03	1	24CSP1172	Communications and Signal processing Audit Course-1	0	P	0	2026-06-06 16:37:18.648297+00
113	NM2403CP04	1	24CSP1172	Communications and Signal processing Audit Course-1	0	P	0	2026-06-06 16:37:18.653273+00
114	NM2403CP05	1	24CSP1172	Communications and Signal processing Audit Course-1	0	P	0	2026-06-06 16:37:18.657751+00
115	NM2403CP06	1	24CSP1172	Communications and Signal processing Audit Course-1	0	P	0	2026-06-06 16:37:18.661531+00
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, student_id, name, branch, batch, password_hash, created_at) FROM stdin;
19	NM2403CP01	NM2403CP01	ECE	2025	123456	2026-06-06 16:37:18.419422+00
20	NM2403CP02	NM2403CP02	ECE	2025	123456	2026-06-06 16:37:18.430276+00
21	NM2403CP03	NM2403CP03	ECE	2025	123456	2026-06-06 16:37:18.436643+00
22	NM2403CP04	NM2403CP04	ECE	2025	123456	2026-06-06 16:37:18.444046+00
23	NM2403CP05	NM2403CP05	ECE	2025	123456	2026-06-06 16:37:18.451972+00
24	NM2403CP06	NM2403CP06	ECE	2025	123456	2026-06-06 16:37:18.459194+00
\.


--
-- Name: pdf_uploads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pdf_uploads_id_seq', 4, true);


--
-- Name: results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.results_id_seq', 115, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.students_id_seq', 24, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 5wtbye4eij85ygF6pmcBaNMVeCFDrwKgjXYI0RwqNIqANOWow0dmqEHDoc7UgMQ

