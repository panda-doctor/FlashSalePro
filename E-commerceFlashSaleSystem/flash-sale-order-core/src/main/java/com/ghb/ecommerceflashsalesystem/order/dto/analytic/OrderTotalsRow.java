package com.ghb.ecommerceflashsalesystem.order.dto.analytic;

import lombok.Data;

/**
 * 看板汇总行（单条 SQL 一次取齐，避免多次往返）。
 */
@Data
public class OrderTotalsRow {
    private long orderCount;
    private long gmv;
    private long userCount;
    private long todayOrderCount;
    private long todayGmv;
}
