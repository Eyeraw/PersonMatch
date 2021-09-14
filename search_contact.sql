CREATE OR REPLACE FUNCTION search_contact (p_last_name VARCHAR2,
                                           p_fst_name VARCHAR2,
                                           p_mid_name VARCHAR2,
                                           p_birth_dt DATE,
                                           p_dul_deries VARCHAR2,
                                           p_dul_num VARCHAR2,
                                           p_in_search_type VARCHAR2,
                                           p_threshold NUMBER,
                                           p_in_con_cd VARCHAR2)
RETURN mdm_search_contact_res_tab PIPELINED
AS
  CURSOR cur_search_null IS
  SELECT out_con_id, out_match_score FROM (
    SELECT con.row_id AS out_con_id, 99 AS out_match_score
      FROM s_contact con
      JOIN s_ps_credential cred ON con.row_id = cred.contact_id
     WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
       AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
       AND NVL(replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'), ' ') = NVL(replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'), ' ')
       AND cred.credential_num = p_dul_num
       AND REPLACE(nvl(cred.x_ser, 'null'),' ','') = REPLACE(nvl(p_dul_deries, 'null'),' ','') -- svv
       AND nvl(p_dul_num,'0') <> '0' -- svv
       AND TRUNC(con.birth_dt) = TRUNC(p_birth_dt)
       AND NVL(con.con_cd,'1') <> 3
       AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
       AND p_threshold  <= 99
       AND con.priv_flg = 'N' -- svv
       AND con.emp_flg = 'N'  -- svv
       AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
--       AND con.last_upd>sysdate-1/4 -- svv
     ORDER BY out_match_score DESC)
   WHERE rownum <= 50;
 
  CURSOR cur_search_cust IS
  SELECT out_con_id, out_match_score
    FROM (
    SELECT out_con_id, MAX(out_match_score) AS out_match_score
        FROM (
            SELECT con.row_id AS out_con_id, 99 AS out_match_score
              FROM s_contact con
              JOIN s_ps_credential cred ON con.row_id = cred.contact_id
             WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
               AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
               AND nvl(replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'), ' ') = nvl(replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'), ' ')
               AND cred.credential_num = p_dul_num
               AND REPLACE(nvl(cred.x_ser, 'null'),' ','') = REPLACE(nvl(p_dul_deries, 'null'),' ','') -- svv
               AND nvl(p_dul_num,'0') <> '0' -- svv
               AND TRUNC(con.birth_dt) = TRUNC(p_birth_dt)
               AND NVL(con.con_cd,'1') <> 3
               AND p_threshold  <= 99
               AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
               AND con.PRIV_FLG = 'N' -- svv
               AND con.EMP_FLG = 'N'  -- svv
               AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
  --             AND con.last_upd>sysdate-1/4 -- svv
            UNION ALL
            SELECT con.row_id AS out_con_id, 80 AS out_match_score
              FROM s_contact con
             WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
               AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
               AND (con.mid_name IS NULL
                OR p_mid_name IS NULL
                OR replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
               AND TRUNC(con.birth_dt) = TRUNC(p_birth_dt)
               AND NVL(con.con_cd,'1') <> 3
               AND p_threshold  <= 80
               AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
               AND con.PRIV_FLG = 'N' -- svv
               AND con.EMP_FLG = 'N'  -- svv
               AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
 --              AND con.last_upd>sysdate-1/4 -- svv
            UNION ALL
            SELECT con.row_id AS out_con_id, 79 AS out_match_score
              FROM s_contact con
              JOIN s_ps_credential cred ON con.row_id = cred.contact_id
             WHERE cred.credential_num = p_dul_num
               AND REPLACE(cred.x_ser,' ','') = REPLACE(p_dul_deries,' ','')
               AND (con.fst_name IS NULL
                OR p_fst_name IS NULL
                OR replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
               AND (con.last_name IS NULL
                OR p_last_name IS NULL
                OR replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
               AND (con.mid_name IS NULL
                OR p_mid_name IS NULL
                OR replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
               AND (con.birth_dt IS NULL
                OR p_birth_dt IS NULL
                OR TRUNC(con.birth_dt) = TRUNC(p_birth_dt))
               AND NVL(con.con_cd,'1') <> 3
               AND p_threshold  <= 79
               AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
               AND con.PRIV_FLG = 'N' -- svv
               AND con.EMP_FLG = 'N'  -- svv
               AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
   --            AND con.last_upd>sysdate-1/4 -- svv
            UNION ALL
            SELECT con.row_id AS out_con_id, 78 AS out_match_score
              FROM s_contact con
             WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
               AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
               AND con.birth_dt IS NULL
               AND p_birth_dt IS NULL
               AND (con.mid_name IS NULL
                OR p_mid_name IS NULL
                OR replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
               AND NVL(con.con_cd,'1') <> 3
               AND p_threshold  <= 78
               AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
               AND con.PRIV_FLG = 'N' -- svv
               AND con.EMP_FLG = 'N'  -- svv
               AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
            UNION ALL
            SELECT con.row_id AS out_con_id, 78 AS out_match_score
              FROM s_contact con
             WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
               AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
               AND con.birth_dt IS NOT NULL
               AND p_birth_dt IS NULL
               AND (con.mid_name IS NULL
                OR p_mid_name IS NULL
                OR replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
               AND NVL(con.con_cd,'1') <> 3
               AND p_threshold  <= 78
               AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
               AND con.PRIV_FLG = 'N' -- svv
               AND con.EMP_FLG = 'N'  -- svv
               AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
     --          AND con.last_upd>sysdate-1/4 -- svv
            )
     GROUP BY out_con_id
     ORDER BY out_match_score DESC)
   WHERE rownum <= 50;
 
  CURSOR cur_search_all IS
  SELECT out_con_id, out_match_score
    FROM (
    SELECT out_con_id, MAX(out_match_score) AS out_match_score
      FROM (
          SELECT con.row_id AS out_con_id, 99 AS out_match_score
            FROM s_contact con
            JOIN s_ps_credential cred ON con.row_id = cred.contact_id
           WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
             AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
             AND nvl(replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'), ' ') = nvl(replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'), ' ')
             AND cred.credential_num = p_dul_num
             AND REPLACE(nvl(cred.x_ser, 'null'),' ','') = REPLACE(nvl(p_dul_deries, 'null'),' ','') -- svv
             AND nvl(p_dul_num,'0') <> '0' -- svv
             AND TRUNC(con.birth_dt) = TRUNC(p_birth_dt)
             AND p_threshold  <= 99
             AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
             AND con.PRIV_FLG = 'N' -- svv
             AND con.EMP_FLG = 'N'  -- svv
             AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
 --            AND con.last_upd>sysdate-1/4 -- svv
          UNION ALL
          SELECT con.row_id AS out_con_id, 80 AS out_match_score
            FROM s_contact con
           WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
             AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
             AND (con.mid_name IS NULL
              OR p_mid_name IS NULL
              OR replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
             AND TRUNC(con.birth_dt) = TRUNC(p_birth_dt)
             AND p_threshold  <= 80
             AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
             AND con.PRIV_FLG = 'N' -- svv
             AND con.EMP_FLG = 'N'  -- svv
             AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
   --          AND con.last_upd>sysdate-1/4 -- svv
          UNION ALL
          SELECT con.row_id AS out_con_id, 79 AS out_match_score
            FROM s_contact con
            JOIN s_ps_credential cred ON con.row_id = cred.contact_id
           WHERE cred.credential_num = p_dul_num
             AND REPLACE(cred.x_ser,' ','') = REPLACE(p_dul_deries,' ','')
             AND (con.fst_name IS NULL
              OR p_fst_name IS NULL
              OR replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
             AND (con.last_name IS NULL
              OR p_last_name IS NULL
              OR replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
             AND (con.mid_name IS NULL
              OR p_mid_name IS NULL
              OR replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
             AND (con.birth_dt IS NULL
              OR p_birth_dt IS NULL
              OR TRUNC(con.birth_dt) = TRUNC(p_birth_dt))
             AND p_threshold  <= 79
             AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
             AND con.PRIV_FLG = 'N' -- svv
             AND con.EMP_FLG = 'N'  -- svv
             AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
   --          AND con.last_upd>sysdate-1/4 -- svv
          UNION ALL
          SELECT con.row_id AS out_con_id, 78 AS out_match_score
            FROM s_contact con
           WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
             AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
             AND con.birth_dt IS NULL
             AND p_birth_dt IS NULL
             AND (con.mid_name IS NULL
                OR p_mid_name IS NULL
                OR replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
             AND p_threshold  <= 78
             AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
             AND con.PRIV_FLG = 'N' -- svv
             AND con.EMP_FLG = 'N'  -- svv
             AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
   --          AND con.last_upd>sysdate-1/4 -- svv
          UNION ALL
          SELECT con.row_id AS out_con_id, 78 AS out_match_score
            FROM s_contact con
           WHERE replace(NLS_UPPER(con.last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_last_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
             AND replace(NLS_UPPER(con.fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_fst_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е')
             AND con.birth_dt IS NOT NULL
             AND p_birth_dt IS NULL
             AND (con.mid_name IS NULL
              OR p_mid_name IS NULL
              OR replace(NLS_UPPER(con.mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е') = replace(NLS_UPPER(p_mid_name,'nls_sort=''GENERIC_BASELETTER'''),'Ё','Е'))
--             AND NVL(con.con_cd,'1') <> 3
             AND p_threshold  <= 78
             AND con.X_MATCH_SKIP_FLG = 'N' --##IPEREZHOGIN 20210914 MagnitPay
             AND con.PRIV_FLG = 'N' -- svv
             AND con.EMP_FLG = 'N'  -- svv
             AND nvl(con.x_terminated_flg, 'N') <> 'Y' --##DKORKMASOV BR-15711 Заблокированные ФЛ не участвуют в поиске
   --          AND con.last_upd>sysdate-1/4 -- svv
          )
     GROUP BY out_con_id
     ORDER BY out_match_score DESC)
   WHERE rownum <= 50;
 
   v_rec cur_search_null%ROWTYPE;
BEGIN
  IF p_in_search_type IS NULL AND NVL(p_in_con_cd,'1') IN ('0','1','2') THEN
    OPEN cur_search_null;
    LOOP
      FETCH cur_search_null INTO v_rec;
      EXIT WHEN cur_search_null%NOTFOUND;
      PIPE ROW(mdm_search_contact_res(v_rec.out_con_id,
                                      v_rec.out_match_score));
    END LOOP;
    CLOSE cur_search_null;
  ELSIF p_in_search_type = 'cust' AND p_in_con_cd IS NULL  THEN
    OPEN cur_search_cust;
    LOOP
      FETCH cur_search_cust INTO v_rec;
      EXIT WHEN cur_search_cust%NOTFOUND;
      PIPE ROW(mdm_search_contact_res(v_rec.out_con_id,
                                      v_rec.out_match_score));
    END LOOP;
    CLOSE cur_search_cust;
  ELSIF p_in_search_type = 'all' AND p_in_con_cd IS NULL THEN
    OPEN cur_search_all;
    LOOP
      FETCH cur_search_all INTO v_rec;
      EXIT WHEN cur_search_all%NOTFOUND;
      PIPE ROW(mdm_search_contact_res(v_rec.out_con_id,
                                      v_rec.out_match_score));
    END LOOP;
    CLOSE cur_search_all;
  END IF;
  RETURN;
END;
  