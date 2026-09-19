Carra 해커톤 견적서 데이터셋 안내
=================================

1. 목적
-------
본 데이터셋은 Dream AI Hackathon 2026에서 개발 중인 Carra MVP 테스트용 자료입니다.

이번 MVP의 핵심 기능은 아래 2가지입니다.

1) Understand My Estimate
   - 자동차 정비 견적서 / 인보이스 / Repair Order를 읽고
   - 항목, 부품비, 공임, 세금, 총액 등을 구조화
   - 운전자 눈높이에서 쉽게 설명

2) Questions to Ask
   - 견적서 내용을 바탕으로
   - 운전자가 정비사 또는 Service Advisor에게 확인하면 좋은 질문을 생성

중요:
Carra는 정비사의 진단과 수리 판단을 대신하지 않습니다.
AI는 운전자가 견적서와 정비 내용을 더 잘 이해하도록 돕는 역할을 합니다.


2. 압축파일 구성
----------------
samples/
- 총 30개의 Synthetic PDF 견적서 / Invoice / Repair Order
- 실제 고객 개인정보가 없는 테스트용 문서
- 다양한 정비 항목과 문서 레이아웃을 포함

carra_estimate_output.schema.json
- Carra AI가 반환해야 할 표준 JSON Schema
- 문서 정보, 차량 정보, 정비 항목, 금액, 승인 상태, 운전자용 설명, Questions to Ask 등을 정의

carra_system_prompt.txt
- Carra AI의 System Prompt
- 주요 Guardrail 포함
  · 차량을 직접 진단하지 않음
  · 가격의 적정성 판단하지 않음
  · 수리 필요/불필요를 단정하지 않음
  · 정비사의 판단을 대체하지 않음

carra_user_prompt_template.txt
- 견적서 1건을 분석할 때 사용하는 User Prompt Template

carra_two_stage_recommendation.txt
- 권장 AI 처리 구조
  Stage A: Document Parser
  Stage B: Driver Explainer

ground_truth.jsonl
- 30개 Synthetic 문서에 대한 정답 Extraction 데이터
- 개발 결과 검증용

sample_manifest.csv
- 24개 샘플의 문서 유형, 차량, 카테고리, 난이도, 목적 정리

source_manifest.txt
- 데이터셋 구조 설계 시 참고한 공개 자료 목록

README.txt
- 영문 안내문

README_KR.txt
- 현재 파일


3. 24개 샘플의 구성
-------------------
다양한 실제 정비 상황을 테스트할 수 있도록 구성했습니다.

주요 정비 항목:
- Brake
- Tire
- Battery
- Oil / Maintenance
- Suspension
- Air Conditioning
- Cooling
- Electrical
- Check Engine / Diagnostic
- Transmission
- Multi-service

문서 구조:
- Standard Estimate
- Invoice
- Repair Order
- Parts / Labor Split
- Approved / Declined
- Additional Authorization
- Deposit / Balance
- Mobile Mechanic
- Quick Lube
- 2-page Estimate
- Abbreviation-heavy Receipt
- Simulated Phone-photo Scan


4. 개발 시작 시 추천 샘플
------------------------
먼저 아래 6개로 Core Flow를 테스트하는 것을 추천합니다.

01_brake_standard_estimate.pdf
03_battery_charging_estimate.pdf
08_check_engine_diagnostic_estimate.pdf
10_multi_service_estimate.pdf
17_repair_order_authorization_limit.pdf
20_approved_declined_items.pdf

이 6개에서 아래 Flow가 안정적으로 동작하는지 먼저 확인합니다.

PDF / Image
→ Structured JSON
→ Plain-language Explanation
→ Questions to Ask


5. Hard Test 샘플
----------------
Core 기능이 안정화된 이후 아래 4개로 Stress Test를 진행합니다.

21_additional_work_authorization.pdf
- 추가 작업 승인 상황

22_two_page_complex_estimate.pdf
- 2페이지 복합 견적서

23_phone_photo_simulated_scan.pdf
- 흐리고 약간 기울어진 휴대폰 촬영 형태
- OCR / Vision Stress Test용

24_abbreviated_compact_receipt.pdf
- 약어가 많은 Compact Receipt

주의:
23번은 일부러 어렵게 만든 테스트 문서이므로 메인 Live Demo에는 권장하지 않습니다.


6. Live Demo 추천
----------------
메인 Demo에는 아래 샘플을 추천합니다.

1순위
01_brake_standard_estimate.pdf

2순위
18_diagnostic_recommended_work.pdf

이유:
- 정비 내용이 직관적
- Parts / Labor / Recommendation 구조가 명확
- 운전자 입장에서 설명이 필요한 항목이 있음
- Questions to Ask 기능이 자연스럽게 연결됨


7. Carra AI 출력 구조
--------------------
Carra는 견적서를 분석한 뒤 대략 아래 정보를 반환합니다.

[Document]
- Estimate / Invoice / Repair Order
- Document Number
- Date
- Shop

[Vehicle]
- Year
- Make
- Model
- Mileage

[Customer Concern]
- 운전자가 정비소에 전달한 문제

[Items]
- Service / Repair Item
- Parts Amount
- Labor Hours
- Labor Rate
- Labor Amount
- Line Total
- Status
  · Recommended
  · Authorized
  · Approved
  · Declined
  · Performed
  · Pending Diagnosis
  · Additional Authorization Required

[Totals]
- Parts Subtotal
- Labor Subtotal
- Fees
- Tax
- Total
- Deposit
- Balance Due

[Driver View]
- Plain-language Summary
- Item Explanation
- Questions to Ask
- Uncertainties


8. AI 처리 구조 권장
--------------------
한 번의 LLM 호출로 모든 것을 처리하기보다 아래 2단계 구조를 권장합니다.

Stage A — Document Parser
-------------------------
Input:
PDF / Image

Output:
Structured JSON

역할:
- 문서 정보 추출
- Vehicle 정보 추출
- Line Item 구조화
- Parts / Labor / Tax / Total 추출
- 승인 상태 구분

권장:
Temperature 낮게 설정


Stage B — Driver Explainer
--------------------------
Input:
Stage A의 Structured JSON

Output:
- Plain-language Explanation
- Questions to Ask

역할:
- 정비 내용을 운전자 눈높이로 설명
- 정비사에게 확인할 질문 생성

장점:
- Hallucination 감소
- 디버깅 용이
- Extraction 오류와 Explanation 오류를 분리 가능
- 발표 시 기술구조 설명이 쉬움


9. 반드시 지켜야 할 Guardrail
-----------------------------
Carra는 아래 판단을 하지 않습니다.

X 차량 고장 원인 확정 진단
X 정비사가 맞다 / 틀리다 판단
X 해당 수리가 필요 / 불필요하다고 단정
X 견적 가격이 싸다 / 비싸다 / 바가지라고 판단
X 문서에 없는 정보를 추정하여 생성

Carra가 하는 역할:

O 견적서에 적힌 내용을 정확히 구조화
O 어려운 정비 용어를 쉽게 설명
O 운전자가 이해해야 할 핵심 항목 정리
O 정비사에게 확인하면 좋은 질문 생성
O 불확실한 정보는 불확실하다고 표시


10. MVP 성공 기준
----------------
오늘 MVP에서는 아래 정도면 충분합니다.

- 문서 유형을 정확히 구분
- 차량 정보 및 Mileage 추출
- 정비 항목별 Parts / Labor 구조화
- Total 금액 정확히 추출
- Recommended / Approved / Declined / Performed 상태 유지
- 운전자 눈높이 설명 생성
- 2~6개의 Questions to Ask 생성
- AI가 정비 판단을 대신하지 않음


11. 오늘 개발 우선순위
---------------------
Must Have

1. Estimate / Invoice 입력
2. Structured JSON Extraction
3. Plain-language Explanation
4. Questions to Ask

Optional

5. 더 다양한 문서 형태 대응
6. OCR Stress Test
7. Voice 기능
8. Vehicle Memory 연계

현재 해커톤에서는 기능을 많이 넣는 것보다
“한 개의 사용자 Flow를 안정적으로 끝까지 보여주는 것”을 우선합니다.


12. 핵심 메시지
--------------
Mechanics diagnose cars.
Carra helps drivers understand.

Generic AI knows cars.
Carra knows YOUR car.

이번 해커톤 MVP 한 줄 설명:

Carra helps drivers understand repair estimates
and know what to ask their mechanic.


13. 데이터 관련 주의
-------------------
본 압축파일의 24개 PDF는 모두 해커톤 테스트를 위해 새로 제작한 Synthetic 자료입니다.

- 실제 고객 개인정보 없음
- 실제 정비소 고객 데이터 아님
- 실제 업체 견적서를 그대로 복제한 자료 아님
- 공개된 업계 자료와 공식 문서 구조를 참고하여 테스트용으로 재구성

따라서 해커톤 개발 및 테스트 용도로 사용하기에 적합합니다.


14. 팀 내 추천 사용 순서
-----------------------
1. README_KR.txt 확인
2. 01번 PDF로 Parser 연결
3. carra_estimate_output.schema.json 적용
4. carra_system_prompt.txt 적용
5. ground_truth.jsonl과 결과 비교
6. 03 / 08 / 10 / 17 / 20 테스트
7. Driver Explanation 연결
8. Questions to Ask 연결
9. 21~24 Hard Test
10. Demo용 01 또는 18 최종 검증


END


15. 전기차(EV) 추가 샘플
----------------------
25_ev_high_voltage_battery_diagnostic_estimate.pdf
- 고전압 배터리 경고 / 진단 견적
- 배터리 진단, 절연 테스트, 열관리 점검

26_ev_ac_charging_port_estimate.pdf
- AC 충전 중단
- 충전시스템 진단, Charge Inlet, Lock Actuator

27_ev_battery_thermal_management_estimate.pdf
- 배터리 열관리 / 냉각수 계통

28_ev_drive_unit_noise_estimate.pdf
- Electric Drive Unit 소음 진단

29_ev_12v_dc_dc_estimate.pdf
- EV의 12V 저전압 배터리와 DC-DC 계통
- Traction Battery와 12V Battery를 구분하는 테스트

30_ev_regen_brake_inspection_estimate.pdf
- Regenerative Braking + Mechanical Brake 진단

EV 핵심 Guardrail:
- 12V 저전압 계통과 고전압 Traction Battery를 구분
- 문서에 없는 Battery SOH / 열화율 / 주행거리 영향 추정 금지
- Pack/Module 교체 필요성을 AI가 임의 판단하지 않음
- 고전압 시스템 DIY 수리 지침 제공 금지
- Diagnostic / Pending / Completed 상태를 정확히 구분
