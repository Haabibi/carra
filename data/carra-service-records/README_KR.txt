Carra 정비내역서 데이터셋 안내
================================

1. 목적
-------
이 데이터셋은 Carra가 '정비가 끝난 뒤 받은 정비내역서 / Service Record / Diagnostic Report / Inspection Report'를 읽고 차량 이력으로 구조화할 수 있는지 테스트하기 위한 Synthetic 자료입니다.

견적서 데이터와 가장 중요한 차이:
- 견적서: 앞으로 무엇을 할지 / 얼마가 들지 이해
- 정비내역서: 실제로 무엇을 발견했고, 무엇을 했고, 무엇이 남았는지 이해

핵심 Flow:
정비내역서 PDF/Image
→ Technician Findings 추출
→ Work Performed 추출
→ 비용/상태/보증/권고사항 구조화
→ 운전자용 쉬운 요약
→ 차량 정비이력으로 저장 가능한 JSON

2. 압축파일 구성
----------------
samples/
- 30개 Synthetic PDF
- 실제 개인정보 없는 테스트 문서
- Service Record / Diagnostic Report / Inspection / Warranty Repair 등 포함

carra_service_record_output.schema.json
- AI 표준 출력 JSON Schema

carra_service_record_system_prompt.txt
- System Prompt / Guardrail

carra_service_record_user_prompt_template.txt
- 개별 문서 분석용 User Prompt

carra_service_record_two_stage_recommendation.txt
- Parser → Vehicle History Explainer 권장 구조

ground_truth.jsonl
- 30개 문서의 정답 extraction 데이터

sample_manifest.csv
- 문서별 유형 / 차량 / 난이도 / 테스트 목적

3. 가장 중요한 데이터 구분
-------------------------
Carra는 아래를 절대 섞으면 안 됩니다.

A. Customer Concern
운전자가 처음 정비소에 말한 증상

B. Technician Findings
정비사가 실제 점검 후 문서에 기록한 발견사항

C. Work Performed
실제로 완료한 작업

D. Recommendations
앞으로 지켜보거나 나중에 할 것을 권고한 내용

E. Declined Work
제안되었지만 하지 않은 작업

Finding != Repair
Recommendation != Completed Work
Declined != Completed Work

4. 추천 테스트 순서
------------------
먼저:
01_brake_repair_service_record.pdf
03_battery_replacement_service_record.pdf
08_check_engine_diagnostic_record.pdf
10_multi_service_record.pdf
17_inspection_repair_record.pdf
20_partial_service_record.pdf

Hard Test:
21_additional_repair_completed_record.pdf
22_two_page_service_history.pdf
23_phone_photo_service_record.pdf
24_abbreviated_service_receipt.pdf

5. Live Demo 추천
----------------
1순위: 01_brake_repair_service_record.pdf
2순위: 18_ignition_repair_record.pdf

23번은 OCR stress test용이므로 메인 Demo에는 권장하지 않습니다.

6. AI Guardrail
---------------
하지 않음:
- 새로운 차량 진단 생성
- 정비사의 판단을 맞다/틀리다 평가
- 가격 적정성 평가
- Recommendation을 Completed Work로 오인
- Findings를 임의로 Repair로 변환
- 문서에 없는 Warranty/Part/Labor 생성

해야 함:
- 문서에 적힌 사실을 정확히 분리
- Findings와 Work Performed를 구분
- Completed / Declined / Warranty / Courtesy 상태 유지
- 다음에 운전자가 기억해야 할 내용을 쉽게 요약
- 불확실한 OCR은 불확실하다고 표시

7. 향후 Carra 활용
-----------------
이 데이터 구조는 향후 My Car Memory / Vehicle History의 기반으로 활용할 수 있습니다.

예:
2026-09-19 / 84,210 miles
- Customer concern: braking vibration
- Finding: front pads below service limit, rotor runout
- Completed: front pads + rotors
- Warranty: 24 months / 24,000 miles
- Next: recheck brakes at future maintenance

END


8. 전기차(EV) 추가 샘플
----------------------
25_ev_high_voltage_battery_diagnostic_record.pdf
- 고전압 배터리 Diagnostic Report
- 진단 수행과 실제 부품 교체를 구분

26_ev_charge_port_service_record.pdf
- AC 충전 장애
- Charge-port lock actuator 교체 완료 기록

27_ev_battery_cooling_service_record.pdf
- Battery Thermal Management / Coolant Service

28_ev_drive_unit_service_record.pdf
- Electric Drive Unit 소음 진단 및 Mount 교체 기록

29_ev_12v_dc_dc_service_record.pdf
- EV 12V Battery / DC-DC 계통
- 고전압 Traction Battery와의 구분

30_ev_regen_brake_diagnostic_record.pdf
- Regenerative Braking / Mechanical Brake 검사
- 부품 교체 없는 Diagnostic/Inspection 사례

EV 데이터 처리 시 특히 주의:
- Fault Code / Warning != 새로운 AI 진단
- Technician Finding != Component Replacement
- 12V Battery != High-voltage Traction Battery
- Battery SOH / Degradation / Range Loss는 문서에 명시된 경우만 사용
- 고전압 계통 관련 DIY 안내 금지
