package com.ghb.ecommerceflashsalesystem.activity.service;

import com.ghb.ecommerceflashsalesystem.activity.dto.request.ActivityRequest;
import com.ghb.ecommerceflashsalesystem.activity.dto.response.ActivityCheckResponse;
import com.ghb.ecommerceflashsalesystem.activity.vo.ActivityItemVO;
import com.ghb.ecommerceflashsalesystem.activity.vo.SeckillActivityVO;
import com.ghb.ecommerceflashsalesystem.common.api.PageResponse;

import java.util.List;

/**
 * 秒杀活动服务接口
 */
public interface SeckillActivityService {

    /**
     * 活动广场列表（按开始时间倒序，最多 50 条），附商品信息与实时库存
     *
     * @return 活动列表条目
     */
    List<ActivityItemVO> listActivities();

    /**
     * 管理端活动分页列表：支持活动名关键字与状态快照过滤。
     *
     * @param page     页码（从 1 开始）
     * @param pageSize 每页条数
     * @param keyword  活动名关键字，可为空
     * @param status   活动状态枚举名，可为空（不过滤）
     * @return 分页结果（含商品信息与实时库存）
     */
    PageResponse<ActivityItemVO> pageActivities(long page, long pageSize, String keyword, String status);

    /**
     * 创建或更新活动
     *
     * @param request 活动请求DTO
     * @return 活动ID
     */
    Long createActivity(ActivityRequest request);

    /**
     * 获取活动详情（含实时库存，缓存优先）
     *
     * @param activityId 活动ID
     * @return 活动视图对象，不存在返回null
     */
    SeckillActivityVO getActivityDetail(Long activityId);

    /**
     * 校验用户是否可以参与活动
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 校验响应
     */
    ActivityCheckResponse checkActivity(Long activityId, Long userId);
}