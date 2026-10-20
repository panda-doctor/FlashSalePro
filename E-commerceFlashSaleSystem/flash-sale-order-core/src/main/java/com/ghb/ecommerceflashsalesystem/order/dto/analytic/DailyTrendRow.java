package com.ghb.ecommerceflashsalesystem.order.dto.analytic;

import lombok.Data;

/**
 * 按天订单趋势投影（date 为 yyyy-MM-dd 字符串）。
 */
@Data
public class DailyTrendRow {
    private String day;
    private long orderCount;
    private long gmv;
}
